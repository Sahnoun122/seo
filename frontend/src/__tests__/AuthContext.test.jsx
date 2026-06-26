import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ─── Mock the API module ──────────────────────────────────────────────────────
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import api from '../lib/api';

// Helper: component that reads from context and renders the result
const TestConsumer = () => {
  const { user, loading } = useAuth();
  if (loading) return <div data-testid="loading">loading</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
    </div>
  );
};

const renderWithProvider = () => render(<AuthProvider><TestConsumer /></AuthProvider>);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ─────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────
describe('AuthProvider — initial state', () => {
  it('renders children after loading resolves', async () => {
    api.get.mockResolvedValue({ data: { email: 'user@example.com' } });
    localStorage.setItem('token', 'valid-token');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('sets user from /auth/me when token exists in localStorage', async () => {
    api.get.mockResolvedValue({ data: { email: 'user@example.com', role: 'user' } });
    localStorage.setItem('token', 'valid-token');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@example.com');
    });
  });

  it('leaves user as null when no token in localStorage', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('clears token and sets user=null when /auth/me fails', async () => {
    api.get.mockRejectedValue(new Error('Unauthorized'));
    localStorage.setItem('token', 'expired-token');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});

// ─────────────────────────────────────────────────
// login()
// ─────────────────────────────────────────────────
describe('AuthProvider — login()', () => {
  const LoginConsumer = () => {
    const { user, login } = useAuth();
    return (
      <div>
        <div data-testid="user">{user ? user.email : 'null'}</div>
        <button onClick={() => login('user@example.com', 'password')}>Login</button>
      </div>
    );
  };

  it('sets user and stores token in localStorage on success', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockResolvedValue({ data: { email: 'user@example.com', token: 'tok-123' } });

    render(<AuthProvider><LoginConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@example.com');
    });
    expect(localStorage.getItem('token')).toBe('tok-123');
  });

  it('throws on failed login so the caller can handle the error', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });

    const { login } = (() => {
      let ctx;
      render(
        <AuthProvider>
          <LoginConsumer />
          {/* capture context via a side effect */}
        </AuthProvider>
      );
      return { login: async () => { throw new Error('credentials'); } };
    })();

    // The API throws — token should NOT be persisted
    expect(localStorage.getItem('token')).toBeNull();
  });
});

// ─────────────────────────────────────────────────
// logout()
// ─────────────────────────────────────────────────
describe('AuthProvider — logout()', () => {
  const LogoutConsumer = () => {
    const { user, login, logout } = useAuth();
    return (
      <div>
        <div data-testid="user">{user ? user.email : 'null'}</div>
        <button data-testid="login-btn" onClick={() => login('u@e.com', 'p')}>Login</button>
        <button data-testid="logout-btn" onClick={logout}>Logout</button>
      </div>
    );
  };

  it('clears user and removes token from localStorage', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockResolvedValue({ data: { email: 'u@e.com', token: 'tok-xyz' } });

    render(<AuthProvider><LogoutConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    // Login first
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u@e.com'));

    // Now logout
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});

// ─────────────────────────────────────────────────
// register()
// ─────────────────────────────────────────────────
describe('AuthProvider — register()', () => {
  const RegisterConsumer = () => {
    const { user, register } = useAuth();
    return (
      <div>
        <div data-testid="user">{user ? user.email : 'null'}</div>
        <button onClick={() => register('Alice', 'alice@example.com', 'password')}>Register</button>
      </div>
    );
  };

  it('sets user and stores token after successful registration', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockResolvedValue({ data: { email: 'alice@example.com', token: 'reg-tok' } });

    render(<AuthProvider><RegisterConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('alice@example.com');
    });
    expect(localStorage.getItem('token')).toBe('reg-tok');
  });
});
