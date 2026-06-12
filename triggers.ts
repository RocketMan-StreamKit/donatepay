const currencyOption = (code: string) => ({
  value: code,
  label: { en: code, ru: code, uk: code },
});

const DONATEPAY_CURRENCY_OPTIONS = [
  'BYN',
  'EUR',
  'KZT',
  'RUB',
  'UAH',
  'USD',
].map(currencyOption);

/** Overlay trigger options exposed in overlay settings UI. */
export const registerDonatePayOverlayTriggers = () => {
  return dashboard.registerTriggers([
    {
      type: 'donation',
      label: {
        en: 'Donation',
        ru: 'Донат',
        uk: 'Донат',
      },
      valueType: 'number',
      keyOptions: DONATEPAY_CURRENCY_OPTIONS,
      keyLabel: {
        en: 'Currency',
        ru: 'Валюта',
        uk: 'Валюта',
      },
      valueHint: {
        en: 'Donation amount',
        ru: 'Сумма доната',
        uk: 'Сума донату',
      },
    },
  ]);
};
