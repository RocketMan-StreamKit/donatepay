import { RegenerateConfig } from './config';
import { PLATFORM } from './constants';
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

RegenerateConfig();
