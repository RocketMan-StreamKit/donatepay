import { DonatePayApi } from './api';

/** Reconnect delays after consecutive failures: 5s, 10s, 20s, then 30s forever. */
const RECONNECT_DELAYS_MS = [5_000, 10_000, 20_000, 30_000] as const;

type ReconnectHandler = () => void;

let reconnectHandler: ReconnectHandler | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
/** Index into {@link RECONNECT_DELAYS_MS} for the next scheduled attempt. */
let reconnectAttempt = 0;

/**
 * Registers the callback invoked when a delayed reconnect should run.
 * @param onReconnect Starts a new DonatePay tracking session.
 * @example
 * initDonatePayReconnect(() => { void startDonatePayTracking(); });
 */
export const initDonatePayReconnect = (onReconnect: ReconnectHandler) => {
  reconnectHandler = onReconnect;
};

/**
 * Resets reconnect backoff after a successful connection.
 * @example
 * resetDonatePayReconnectBackoff();
 */
export const resetDonatePayReconnectBackoff = () => {
  reconnectAttempt = 0;
};

/**
 * Cancels a pending reconnect attempt and clears the backoff timer.
 * @example
 * cancelDonatePayReconnect();
 */
export const cancelDonatePayReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

/**
 * Schedules a reconnect with incremental backoff when the API key is present.
 * Does nothing when a reconnect is already scheduled or no API key is configured.
 * @example
 * scheduleDonatePayReconnect();
 */
export const scheduleDonatePayReconnect = () => {
  if (
    !reconnectHandler ||
    !DonatePayApi.accessToken?.trim() ||
    reconnectTimer
  ) {
    return;
  }

  const delay =
    RECONNECT_DELAYS_MS[
      Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)
    ];
  reconnectAttempt = Math.min(
    reconnectAttempt + 1,
    RECONNECT_DELAYS_MS.length - 1
  );

  console.log(`[DonatePay] Reconnect scheduled in ${delay / 1000}s`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectHandler?.();
  }, delay);
};
