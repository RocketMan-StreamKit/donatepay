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

  async getUser(force = false): Promise<DonatePayUser | null> {
    if (!force && this.userCache && Date.now() < this.userCache.expiresAt) {
      return this.userCache.user;
    }

    const token = this.accessToken?.trim();
    if (!token) {
      return null;
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
        if (!parsed.ok) {
          console.error(parsed.message);
        }
        return null;
      }

      const user = parsed.body.data;
      this.userCache = {
        user,
        expiresAt: Date.now() + 60_000,
      };
      return user;
    } catch (error) {
      console.error('Failed to load DonatePay user profile:', error);
      return null;
    }
  }

  async getSocketToken(): Promise<string | null> {
    const token = this.accessToken?.trim();
    if (!token) {
      return null;
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
        return null;
      }

      const socketToken = parsed.body.token?.trim();
      return socketToken || null;
    } catch (error) {
      console.error('DonatePay socket token request failed:', error);
      return null;
    }
  }

  async subscribeChannel(
    clientId: string,
    channel: string
  ): Promise<string | null> {
    const token = this.accessToken?.trim();
    if (!token) {
      return null;
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
        return null;
      }

      const channels = (
        parsed.body as {
          channels?: { channel?: string; token?: string }[];
        }
      ).channels;
      const entry = (channels ?? []).find(item => item.channel === channel);
      const subscriptionToken = entry?.token?.trim();
      if (subscriptionToken) {
        return subscriptionToken;
      }

      return parsed.body.token?.trim() || null;
    } catch (error) {
      console.error('DonatePay channel subscribe failed:', error);
      return null;
    }
  }
})();
