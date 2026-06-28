import { DonatePayApi } from './api';
import {
  DonatePayCentrifugoClient,
  resolveUserIdFromSocketToken,
} from './centrifugo-client';
import {
  cancelDonatePayReconnect,
  initDonatePayReconnect,
  resetDonatePayReconnectBackoff,
  scheduleDonatePayReconnect,
} from './reconnect';
import { notifyConnectionStatus } from './status-notify';

let starting = false;
let centrifugoClient: DonatePayCentrifugoClient | null = null;

/**
 * Marks the connection as failed because of an invalid or missing API key.
 * @param message Error details logged to the console.
 */
const reportAuthFailure = (message: string) => {
  cancelDonatePayReconnect();
  resetDonatePayReconnectBackoff();
  centrifugoClient?.stop();
  centrifugoClient = null;
  DonatePayApi.clearUserCache();
  status.Update({ current: 'error' });
  notifyConnectionStatus('error');
  console.error(`[DonatePay] Auth failed: ${message}`);
};

/**
 * Marks a recoverable connection failure and schedules an automatic reconnect.
 * @param message Error details logged to the console.
 */
const reportRecoverableFailure = (message: string) => {
  status.Update({ current: 'error' });
  notifyConnectionStatus('error');
  console.error(`[DonatePay] ${message}`);
  scheduleDonatePayReconnect();
};

export const reconnectDonatePayTracking = async () => {
  starting = false;
  cancelDonatePayReconnect();
  resetDonatePayReconnectBackoff();
  stopDonatePayTracking({ notify: false });

  if (!DonatePayApi.accessToken) {
    stopDonatePayTracking();
    return;
  }

  await startDonatePayTracking();
};

export const startDonatePayTracking = async () => {
  if (starting || !DonatePayApi.accessToken) {
    return;
  }

  starting = true;
  stopDonatePayTracking({ notify: false });
  status.Update({ current: 'connecting' });

  try {
    const userResult = await DonatePayApi.getUser(true);
    if (!userResult.ok) {
      if (userResult.authError) {
        reportAuthFailure(userResult.message);
      } else {
        reportRecoverableFailure(userResult.message);
      }
      return;
    }

    const socketTokenResult = await DonatePayApi.getSocketToken();
    if (!socketTokenResult.ok) {
      if (socketTokenResult.authError) {
        reportAuthFailure(socketTokenResult.message);
      } else {
        reportRecoverableFailure(socketTokenResult.message);
      }
      return;
    }

    const user = userResult.data;
    const socketToken = socketTokenResult.data;
    const userId = resolveUserIdFromSocketToken(socketToken) || String(user.id);
    centrifugoClient = new DonatePayCentrifugoClient(userId, reportAuthFailure);
    await centrifugoClient.start();

    resetDonatePayReconnectBackoff();
    status.Update({
      current: 'online',
      message: { en: 'DonatePay' },
    });
    notifyConnectionStatus('online');

    console.log(
      `[DonatePay] Tracking started for user ${user.id} (${user.name})`
    );
  } catch (error) {
    console.error('DonatePay tracking failed to start:', error);
    reportRecoverableFailure('DonatePay tracking failed to start');
    stopDonatePayTracking({ notify: false });
  } finally {
    starting = false;
  }
};

export const stopDonatePayTracking = (options?: { notify?: boolean }) => {
  cancelDonatePayReconnect();
  centrifugoClient?.stop();
  centrifugoClient = null;
  DonatePayApi.clearUserCache();
  status.Update({ current: 'offline' });
  if (options?.notify !== false) {
    notifyConnectionStatus('offline');
  }
};

initDonatePayReconnect(() => {
  void startDonatePayTracking();
});
