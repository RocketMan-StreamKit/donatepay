import { DonatePayApi } from './api';
import { CENTRIFUGO_WS_URL } from './constants';
import {
  pushDonation,
  type DonatePayDonationNotification,
} from './dashboard-feed';
import { decodeJwtPayload } from './jwt';
import { scheduleDonatePayReconnect } from './reconnect';

type WsConnection = Awaited<ReturnType<(typeof network.websocket)['connect']>>;

type CentrifugoFrame = {
  id?: number;
  push?: {
    channel?: string;
    pub?: {
      data?: unknown;
    };
  };
  result?: {
    client?: string;
    channel?: string;
    data?: unknown;
  };
  error?: { message?: string };
};

const isPublicChannel = (channel: string) => channel.startsWith('$public:');

const parsePayload = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'string') {
    try {
      return parsePayload(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
};

const pickNotification = (
  payload: Record<string, unknown>
): DonatePayDonationNotification | null => {
  const direct = payload.notification;
  if (direct && typeof direct === 'object') {
    return direct as DonatePayDonationNotification;
  }

  const nested = payload.data;
  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    if (
      nestedRecord.notification &&
      typeof nestedRecord.notification === 'object'
    ) {
      return nestedRecord.notification as DonatePayDonationNotification;
    }
  }

  if (typeof payload.type === 'string' && payload.vars) {
    return payload as DonatePayDonationNotification;
  }

  return null;
};

const extractNotification = (
  frame: CentrifugoFrame
): DonatePayDonationNotification | null => {
  const resultChannel = frame.result?.channel || '';
  if (isPublicChannel(resultChannel) && frame.result?.data !== undefined) {
    const resultData = parsePayload(frame.result.data);
    if (resultData) {
      const pubPayload = parsePayload(resultData.data) ?? resultData;
      const notification = pickNotification(pubPayload);
      if (notification) {
        return notification;
      }
    }
  }

  const pushChannel = frame.push?.channel || '';
  if (isPublicChannel(pushChannel) && frame.push?.pub?.data !== undefined) {
    const pubPayload = parsePayload(frame.push.pub.data);
    if (pubPayload) {
      const notification = pickNotification(pubPayload);
      if (notification) {
        return notification;
      }
    }
  }

  return null;
};

const isDonationNotification = (
  notification: DonatePayDonationNotification
) => {
  if (notification.type === 'donation') {
    return true;
  }
  return !notification.type && Boolean(notification.vars);
};

const OPEN_TIMEOUT_MS = 15_000;

type AuthFailureReporter = (message: string) => void;

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const waitForOpen = (ws: WsConnection) =>
  new Promise<void>((resolve, reject) => {
    if (ws.state === 1) {
      resolve();
      return;
    }

    let openSub: ReturnType<WsConnection['On']> | null = null;
    let errorSub: ReturnType<WsConnection['On']> | null = null;

    const timeout = setTimeout(() => {
      openSub?.Destroy();
      errorSub?.Destroy();
      reject(new Error('WebSocket open timeout'));
    }, OPEN_TIMEOUT_MS);

    openSub = ws.On('open', () => {
      clearTimeout(timeout);
      errorSub?.Destroy();
      resolve();
    });
    errorSub = ws.On('error', (error: Error) => {
      clearTimeout(timeout);
      openSub?.Destroy();
      reject(error);
    });
  });

export class DonatePayCentrifugoClient {
  private connection: WsConnection | null = null;
  private destroyed = false;
  private readonly userId: string;
  private readonly onAuthFailure: AuthFailureReporter;

  constructor(userId: string, onAuthFailure: AuthFailureReporter) {
    this.userId = userId;
    this.onAuthFailure = onAuthFailure;
  }

  async start() {
    this.destroyed = false;
    await this.connect();
  }

  stop() {
    this.destroyed = true;
    this.destroyConnection(this.connection);
    this.connection = null;
  }

  private requestReconnect() {
    if (this.destroyed) {
      return;
    }

    this.destroyConnection(this.connection);
    this.connection = null;
    scheduleDonatePayReconnect();
  }

  private async connect() {
    if (this.destroyed) {
      return;
    }

    try {
      const socketTokenResult = await DonatePayApi.getSocketToken();
      if (!socketTokenResult.ok) {
        if (socketTokenResult.authError) {
          this.onAuthFailure(socketTokenResult.message);
          this.stop();
        } else {
          this.requestReconnect();
        }
        return;
      }

      const socketToken = socketTokenResult.data;

      const ws = await network.websocket.connect(CENTRIFUGO_WS_URL, {});
      if (this.destroyed) {
        ws.Destroy();
        return;
      }

      this.destroyConnection(this.connection);
      this.connection = ws;

      ws.On('message', (raw: string) => {
        void this.onMessage(raw, ws);
      });
      ws.On('close', () => {
        if (!this.destroyed && this.connection === ws) {
          this.requestReconnect();
        }
      });
      ws.On('error', (error: Error) => {
        console.error('DonatePay Centrifugo error:', formatError(error));
      });

      await waitForOpen(ws);

      ws.Send({
        params: { token: socketToken },
        id: 1,
      });
    } catch (error) {
      console.error('DonatePay Centrifugo connect failed:', formatError(error));
      this.requestReconnect();
    }
  }

  private async onMessage(raw: string, ws: WsConnection) {
    let frame: CentrifugoFrame;
    try {
      frame = JSON.parse(raw) as CentrifugoFrame;
    } catch (error) {
      console.error(error);
      return;
    }

    if (frame.id === 1) {
      const clientId = frame.result?.client;
      if (!clientId) {
        console.error(
          'DonatePay Centrifugo auth failed:',
          frame.error?.message || 'missing client id'
        );
        this.requestReconnect();
        return;
      }

      const channel = `$public:${this.userId}`;
      const subscriptionResult = await DonatePayApi.subscribeChannel(
        clientId,
        channel
      );
      if (!subscriptionResult.ok) {
        if (subscriptionResult.authError) {
          this.onAuthFailure(subscriptionResult.message);
          this.stop();
        } else {
          console.error(
            'DonatePay channel subscribe failed:',
            subscriptionResult.message
          );
          this.requestReconnect();
        }
        return;
      }

      const subscriptionToken = subscriptionResult.data;

      try {
        ws.Send({
          id: 2,
          method: 1,
          params: {
            channel,
            token: subscriptionToken,
          },
        });
      } catch (error) {
        console.error('DonatePay channel subscribe failed:', error);
        this.requestReconnect();
      }
      return;
    }

    if (frame.id) {
      if (frame.id === 2) {
        if (frame.error) {
          console.error(
            'DonatePay channel subscribe failed:',
            frame.error.message || 'unknown error'
          );
          this.requestReconnect();
        } else {
          console.log(`[DonatePay] Subscribed to $public:${this.userId}`);
        }
      }
      return;
    }

    const notification = extractNotification(frame);
    if (!notification || !isDonationNotification(notification)) {
      return;
    }

    await pushDonation(notification);
  }

  private destroyConnection(connection: WsConnection | null) {
    if (!connection) {
      return;
    }
    try {
      connection.Destroy();
    } catch (error) {
      console.error(error);
    }
  }
}

export const resolveUserIdFromSocketToken = (socketToken: string) => {
  const payload = decodeJwtPayload(socketToken);
  const sub = payload?.sub;
  if (typeof sub === 'string' && sub.trim()) {
    return sub.trim();
  }
  if (typeof sub === 'number') {
    return String(sub);
  }
  return null;
};
