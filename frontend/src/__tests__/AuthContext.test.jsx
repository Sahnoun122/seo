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
});

// ─────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────
// The session lives in an httpOnly cookie the browser sends automatically —
// AuthContext no longer reads anything from localStorage. It always probes
// GET /auth/me on mount and derives auth state from the response.
describe('AuthProvider — initial state', () => {
  it('renders children after loading resolves', async () => {
    api.get.mockResolvedValue({ data: { email: 'user@example.com' } });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('sets user from /auth/me when a valid session cookie is present', async () => {
    api.get.mockResolvedValue({ data: { email: 'user@example.com', role: 'user' } });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@example.com');
    });
    expect(api.get).toHaveBeenCalledWith('/auth/me', { _skipAuthRedirect: true });
  });

  it('sets user=null when /auth/me fails (no/invalid session cookie)', async () => {
    api.get.mockRejectedValue(new Error('Unauthorized'));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
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

  it('sets user from the login response on success', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockResolvedValue({ data: { email: 'user@example.com' } });

    render(<AuthProvider><LoginConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@example.com');
    });
  });

  it('throws on failed login so the caller can handle the error', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });

    let caughtError = null;
    const ThrowingLoginConsumer = () => {
      const { login } = useAuth();
      return (
        <button onClick={async () => {
          try {
            await login('user@example.com', 'wrong-password');
          } catch (err) {
            caughtError = err;
          }
        }}>Login</button>
      );
    };

    render(<AuthProvider><ThrowingLoginConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => expect(caughtError).not.toBeNull());
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

  it('clears user and asks the backend to clear the session cookie', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockResolvedValue({ data: { email: 'u@e.com' } });

    render(<AuthProvider><LogoutConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    // Login first
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u@e.com'));

    // Now logout
    api.post.mockResolvedValue({ data: { success: true } });
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
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

  it('sets user from the register response on success', async () => {
    api.get.mockResolvedValue({ data: null });
    api.post.mockResolvedValue({ data: { email: 'alice@example.com' } });

    render(<AuthProvider><RegisterConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('alice@example.com');
    });
  });
});
