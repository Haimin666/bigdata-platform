import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  api: {
    fetch: vi.fn(),
  },
}));

const encryptMock = vi.fn(() => 'ENC_PASSWORD');
vi.mock('jsencrypt', () => ({
  default: class {
    setPublicKey() {}
    encrypt = encryptMock;
  },
}));

import { api } from './api';
import { login } from './auth';

const fetchMock = api.fetch as unknown as ReturnType<typeof vi.fn>;

function setupBrowserEnv() {
  const store: Record<string, string> = {};
  (globalThis as any).window = globalThis;
  (globalThis as any).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
  return store;
}

describe('login', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    encryptMock.mockClear();
    setupBrowserEnv();
  });

  it('sends raw password when encryption disabled', async () => {
    fetchMock
      .mockResolvedValueOnce({ enableLoginEncrypt: false, publicKey: '' })
      .mockResolvedValueOnce({});

    await login('alice', 'secret');

    expect(encryptMock).not.toHaveBeenCalled();
    const loginCall = fetchMock.mock.calls[1];
    expect(loginCall[0]).toBe('/user/login');
    expect(loginCall[1]).toEqual({ userName: 'alice', password: 'secret' });
  });

  it('RSA-encrypts password when enableLoginEncrypt is true', async () => {
    fetchMock
      .mockResolvedValueOnce({ enableLoginEncrypt: true, publicKey: 'FAKEKEY' })
      .mockResolvedValueOnce({});

    await login('bob', 'secret');

    expect(encryptMock).toHaveBeenCalledWith('secret');
    const loginCall = fetchMock.mock.calls[1];
    expect(loginCall[1]).toEqual({ userName: 'bob', password: 'ENC_PASSWORD' });
  });

  it('persists baseInfo after login', async () => {
    fetchMock
      .mockResolvedValueOnce({ enableLoginEncrypt: false, publicKey: '' })
      .mockResolvedValueOnce({});

    await login('alice', 'secret');

    expect((globalThis as any).localStorage.getItem('baseInfo')).toContain(
      '"username":"alice"',
    );
  });
});
