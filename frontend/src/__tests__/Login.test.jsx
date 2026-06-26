import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Framer Motion — avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import Login from '../pages/Login';
import { toast } from 'react-hot-toast';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────
describe('Login page — rendering', () => {
  it('renders the email input field', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('renders the password input field', () => {
    renderLogin();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the Sign In submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });

  it('renders a Forgot Password link', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
  });
});

// ─────────────────────────────────────────────────
// Form interaction
// ─────────────────────────────────────────────────
describe('Login page — form interaction', () => {
  it('updates email field on user input', async () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'user@example.com');
    expect(emailInput).toHaveValue('user@example.com');
  });

  it('updates password field on user input', async () => {
    renderLogin();
    const pwInput = screen.getByLabelText(/password/i);
    await userEvent.type(pwInput, 'mypassword');
    expect(pwInput).toHaveValue('mypassword');
  });
});

// ─────────────────────────────────────────────────
// Submission
// ─────────────────────────────────────────────────
describe('Login page — form submission', () => {
  it('calls login() with entered email and password', async () => {
    mockLogin.mockResolvedValue({ email: 'user@example.com' });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('navigates to "/" on successful login', async () => {
    mockLogin.mockResolvedValue({ email: 'user@example.com' });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows success toast on successful login', async () => {
    mockLogin.mockResolvedValue({ email: 'user@example.com' });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Welcome back!');
    });
  });

  it('shows error toast on failed login', async () => {
    mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows generic error message when no server message is returned', async () => {
    mockLogin.mockRejectedValue(new Error('Network Error'));
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'u@e.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password.');
    });
  });

  it('disables the submit button while login is in progress', async () => {
    // Slow login: never resolves during this test
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderLogin();

    const button = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(screen.getByLabelText(/email address/i), 'u@e.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');
    fireEvent.submit(button.closest('form'));

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('does not navigate on failed login', async () => {
    mockLogin.mockRejectedValue({ response: { data: { error: 'Bad credentials' } } });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'u@e.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
