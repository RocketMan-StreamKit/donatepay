import { DonatePayApi } from './api';
import { API_KEY_PAGE_URL } from './constants';
import {
  reconnectDonatePayTracking,
  stopDonatePayTracking,
} from './tracking';

/** Last access token applied to the live DonatePay connection. */
let appliedAccessToken: string | null = null;

const DONATEPAY_CONFIG_SCHEMA = [
  {
    key: 'api_key_info',
    type: 'info',
    editor: {
      label: {
        en: 'How to get an API key',
        ru: 'Как получить API ключ',
        uk: 'Як отримати API ключ',
      },
      description: {
        en: `You can get your DonatePay API key at ${API_KEY_PAGE_URL}`,
        ru: `Получить API ключ DonatePay можно по ссылке ${API_KEY_PAGE_URL}`,
        uk: `Отримати API ключ DonatePay можна за посиланням ${API_KEY_PAGE_URL}`,
      },
      infoBorder: 'blue',
    },
  },
  {
    key: 'open_api_key_page',
    type: 'button',
    event: 'onOpenApiKeyPage',
    editor: {
      label: {
        en: 'Open API key page',
        ru: 'Открыть страницу API ключа',
        uk: 'Відкрити сторінку API ключа',
      },
    },
  },
  {
    key: 'access_token',
    type: 'hidden',
    default: '',
    editor: {
      label: {
        en: 'API Key',
        ru: 'API ключ',
        uk: 'API ключ',
      },
      description: {
        en: 'DonatePay API key from your account settings',
        ru: 'API ключ DonatePay из настроек аккаунта',
        uk: 'API ключ DonatePay з налаштувань облікового запису',
      },
    },
  },
] as const;

/**
 * Reads the saved API token and reconnects when it differs from the active one.
 * @example
 * await syncAccessTokenFromParams();
 */
export const syncAccessTokenFromParams = async () => {
  const params = await api.config.getParams<{ access_token?: string }>();
  const accessToken = (params.access_token || '').trim() || null;

  if (accessToken === appliedAccessToken) {
    return;
  }

  appliedAccessToken = accessToken;
  DonatePayApi.accessToken = accessToken;

  if (accessToken) {
    void reconnectDonatePayTracking();
  } else {
    stopDonatePayTracking();
  }
};

export const RegenerateConfig = () => {
  void syncAccessTokenFromParams();
  GenerateConfig([...DONATEPAY_CONFIG_SCHEMA]);
};
