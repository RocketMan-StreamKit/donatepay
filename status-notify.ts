import { PLATFORM } from './constants';

const NOTIFY_ID = `${PLATFORM}_status`;

type ConnectionNotifyState = 'online' | 'offline' | 'error';

const PLATFORM_NAME = { en: 'DonatePay', ru: 'DonatePay', uk: 'DonatePay' };

/**
 * Pushes a replaceable connection-status notification for DonatePay.
 * @param state Connection state shown to the user.
 */
export const notifyConnectionStatus = (state: ConnectionNotifyState) => {
  if (state === 'online') {
    notify.Send({
      id: NOTIFY_ID,
      type: 'success',
      title: PLATFORM_NAME,
      message: {
        en: 'Connected',
        ru: 'Подключено',
        uk: 'Підключено',
      },
      temp: true,
    });
    return;
  }

  if (state === 'offline') {
    notify.Send({
      id: NOTIFY_ID,
      type: 'info',
      title: PLATFORM_NAME,
      message: {
        en: 'Disconnected',
        ru: 'Отключено',
        uk: 'Відключено',
      },
      temp: true,
    });
    return;
  }

  notify.Send({
    id: NOTIFY_ID,
    type: 'error',
    title: PLATFORM_NAME,
    message: {
      en: 'Connection error',
      ru: 'Ошибка подключения',
      uk: 'Помилка підключення',
    },
    temp: true,
  });
};
