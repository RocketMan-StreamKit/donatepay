import { API_BASE, SOCKET_TOKEN_URL } from './constants';

export type DonatePayUser = {
  id: number;
  name: string;
  avatar: string;
  balance: number;
  cashout_sum: number;
};

type ApiResponse<T> = {
  status?: string;
  data?: T;
  token?: string;
  message?: string;
  error?: string;
};

export type DonatePayApiFailure = {
  ok: false;
  authError: boolean;
  message: string;
};

export type DonatePayApiSuccess<T> = {
  ok: true;
  data: T;
};

export type DonatePayApiResult<T> =
  | DonatePayApiSuccess<T>
  | DonatePayApiFailure;

const AUTH_ERROR_PATTERNS = [
  'unauthorized',
  'invalid access',
  'invalid token',
  'invalid api',
  'invalid key',
  'access_token',
  'access token',
  'access denied',
  'forbidden',
  'wrong token',
  'bad token',
  'api key',
  'неверн',
  'недейств',
  'отказано в доступе',
  'ключ не найден',
] as const;

/**
 * Detects DonatePay API responses that indicate a missing or invalid API key.
 * @param message Error text returned by the API or parser.
 * @example
 * isDonatePayAuthError('Invalid access token'); // true
 */
export const isDonatePayAuthError = (message: string) => {
  const normalized = message.toLowerCase();
  return AUTH_ERROR_PATTERNS.some(pattern => normalized.includes(pattern));
};

export const DonatePayApi = new (class {
  accessToken: string | null = null;
  private userCache: {
    expiresAt: number;
    user: DonatePayUser;
  } | null = null;

  clearUserCache() {
    this.userCache = null;
  }

  private parseBody<T>(response: string, fallback: string) {
    if (!response?.trim()) {
      return { ok: false as const, message: fallback };
    }
    let body: ApiResponse<T> & { message?: string; error?: string };
    try {
      body = JSON.parse(response) as ApiResponse<T> & {
        message?: string;
        error?: string;
      };
    } catch {
      return { ok: false as const, message: fallback };
    }
    const errorMessage = body.error || body.message;
    if (
      errorMessage &&
      body.status !== 'success' &&
      !body.data &&
      !body.token
    ) {
      return { ok: false as const, message: errorMessage };
    }
    return { ok: true as const, body };
  }

  async getUser(force = false): Promise<DonatePayApiResult<DonatePayUser>> {
    if (!force && this.userCache && Date.now() < this.userCache.expiresAt) {
      return { ok: true, data: this.userCache.user };
    }

    const token = this.accessToken?.trim();
    if (!token) {
      return {
        ok: false,
        authError: true,
        message: 'DonatePay API key is not configured',
      };
    }

    try {
      const response = await network.request.get(
        `${API_BASE}/user?access_token=${encodeURIComponent(token)}`
      );
      const parsed = this.parseBody<DonatePayUser>(
        response,
        'Failed to load DonatePay user profile'
      );
      if (
        !parsed.ok ||
        !parsed.body.data ||
        typeof parsed.body.data.id !== 'number'
      ) {
        const message = parsed.ok
          ? 'Failed to load DonatePay user profile'
          : parsed.message;
        console.error(message);
        return {
          ok: false,
          authError: !parsed.ok && isDonatePayAuthError(parsed.message),
          message,
        };
      }

      const user = parsed.body.data;
      this.userCache = {
        user,
        expiresAt: Date.now() + 60_000,
      };
      return { ok: true, data: user };
    } catch (error) {
      console.error('Failed to load DonatePay user profile:', error);
      return {
        ok: false,
        authError: false,
        message: 'Failed to load DonatePay user profile',
      };
    }
  }

  async getSocketToken(): Promise<DonatePayApiResult<string>> {
    const token = this.accessToken?.trim();
    if (!token) {
      return {
        ok: false,
        authError: true,
        message: 'DonatePay API key is not configured',
      };
    }

    try {
      const response = await network.request.post(SOCKET_TOKEN_URL, {
        access_token: token,
      });
      const parsed = this.parseBody<never>(
        response,
        'Failed to get DonatePay socket token'
      );
      if (!parsed.ok) {
        console.error(parsed.message);
        return {
          ok: false,
          authError: isDonatePayAuthError(parsed.message),
          message: parsed.message,
        };
      }

      const socketToken = parsed.body.token?.trim();
      if (!socketToken) {
        return {
          ok: false,
          authError: false,
          message: 'Failed to get DonatePay socket token',
        };
      }

      return { ok: true, data: socketToken };
    } catch (error) {
      console.error('DonatePay socket token request failed:', error);
      return {
        ok: false,
        authError: false,
        message: 'Failed to get DonatePay socket token',
      };
    }
  }

  async subscribeChannel(
    clientId: string,
    channel: string
  ): Promise<DonatePayApiResult<string>> {
    const token = this.accessToken?.trim();
    if (!token) {
      return {
        ok: false,
        authError: true,
        message: 'DonatePay API key is not configured',
      };
    }

    try {
      const response = await network.request.post(
        `${SOCKET_TOKEN_URL}?access_token=${encodeURIComponent(token)}`,
        {
          client: clientId,
          channels: [channel],
        }
      );
      const parsed = this.parseBody<never>(
        response,
        'Failed to subscribe to DonatePay channel'
      );
      if (!parsed.ok) {
        console.error(parsed.message);
        return {
          ok: false,
          authError: isDonatePayAuthError(parsed.message),
          message: parsed.message,
        };
      }

      const channels = (
        parsed.body as {
          channels?: { channel?: string; token?: string }[];
        }
      ).channels;
      const entry = (channels ?? []).find(item => item.channel === channel);
      const subscriptionToken = entry?.token?.trim();
      if (subscriptionToken) {
        return { ok: true, data: subscriptionToken };
      }

      const fallbackToken = parsed.body.token?.trim();
      if (fallbackToken) {
        return { ok: true, data: fallbackToken };
      }

      return {
        ok: false,
        authError: false,
        message: 'Failed to subscribe to DonatePay channel',
      };
    } catch (error) {
      console.error('DonatePay channel subscribe failed:', error);
      return {
        ok: false,
        authError: false,
        message: 'Failed to subscribe to DonatePay channel',
      };
    }
  }
})();
