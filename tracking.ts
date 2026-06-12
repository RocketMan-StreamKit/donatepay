import { DonatePayApi } from './api';
import {
  DonatePayCentrifugoClient,
  resolveUserIdFromSocketToken,
} from './centrifugo-client';
import { notifyConnectionStatus } from './status-notify';

let starting = false;
let centrifugoClient: DonatePayCentrifugoClient | null = null;

export const startDonatePayTracking = async () => {
  if (starting || !DonatePayApi.accessToken) {
    return;
  }

  starting = true;
  stopDonatePayTracking();
  status.Update({ current: 'connecting' });

  try {
    const user = await DonatePayApi.getUser(true);
    if (!user) {
      status.Update({ current: 'error' });
      notifyConnectionStatus('error');
      return;
    }

    const socketToken = await DonatePayApi.getSocketToken();
    if (!socketToken) {
      status.Update({ current: 'error' });
      notifyConnectionStatus('error');
      return;
    }

    const userId = resolveUserIdFromSocketToken(socketToken) || String(user.id);
    centrifugoClient = new DonatePayCentrifugoClient(userId);
    await centrifugoClient.start();

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
    status.Update({ current: 'error' });
    notifyConnectionStatus('error');
    stopDonatePayTracking({ notify: false });
  } finally {
    starting = false;
  }
};

export const stopDonatePayTracking = (options?: { notify?: boolean }) => {
  centrifugoClient?.stop();
  centrifugoClient = null;
  DonatePayApi.clearUserCache();
  status.Update({ current: 'offline' });
  if (options?.notify !== false) {
    notifyConnectionStatus('offline');
  }
};
