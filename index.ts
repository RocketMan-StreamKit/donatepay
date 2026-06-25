import { RegenerateConfig } from './config';
import { API_KEY_PAGE_URL, PLATFORM } from './constants';
import { registerDonatePayOverlayTriggers } from './triggers';

void dashboard.registerPlatform({
  id: PLATFORM,
  name: {
    en: 'DonatePay',
    ru: 'DonatePay',
    uk: 'DonatePay',
  },
});

void registerDonatePayOverlayTriggers();

status.OnClick(() => {
  api.restart();
});

events.On('onOpenApiKeyPage', () => {
  api.openUrl(API_KEY_PAGE_URL);
});

RegenerateConfig();
