import { PLATFORM } from './constants';

export type DonatePayDonationVars = {
  currency?: string;
  name?: string;
  sum?: number;
  comment?: string;
  video?: { link?: string };
};

export type DonatePayDonationNotification = {
  type?: string;
  id?: number;
  vars?: DonatePayDonationVars;
};

const userId = (name: string) => `donatepay:${name.trim().toLowerCase()}`;

const parseNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseId = (value: unknown) => {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return null;
  }
  return Math.trunc(parsed);
};

export const pushDonation = async (
  notification: DonatePayDonationNotification
) => {
  const vars = notification.vars;
  const donationId = parseId(notification.id);
  if (!vars || donationId === null) {
    return;
  }

  const donorName = vars.name?.trim() || 'Anonymous';
  const currency = vars.currency?.trim() || 'RUB';
  const amount = parseNumber(vars.sum) ?? 0;
  const message = vars.comment?.trim() || '';

  const profile = {
    id: userId(donorName),
    name: donorName,
    avatar: '',
    platform: PLATFORM,
  };

  return dashboard.addRecord(
    {
      id: `donatepay:donation:${donationId}`,
      type: 'donation',
      platform: PLATFORM,
      from: profile.id,
      amount: [amount, currency],
      message: message || undefined,
    },
    profile,
    { trigger: { type: 'donation', key: currency, value: amount } }
  );
};
