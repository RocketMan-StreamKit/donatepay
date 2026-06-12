import { DonatePayApi } from './api';
import { startDonatePayTracking, stopDonatePayTracking } from './tracking';

export const RegenerateConfig = () => {
  api.config.getParams().then(params => {
    const access_token = (params.access_token || '').trim();

    DonatePayApi.accessToken = access_token || null;

    if (DonatePayApi.accessToken) {
      void startDonatePayTracking();
    } else {
      stopDonatePayTracking();
    }

    GenerateConfig([
      {
        key: 'access_token',
        type: 'text',
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
    ]);
  });
};
