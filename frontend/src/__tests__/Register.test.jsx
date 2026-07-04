import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import Register from '../pages/Register';
import { toast } from 'react-hot-toast';

const renderRegister = () =>
  render(
    <ThemeProvider>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => vi.clearAllMocks());

// ─────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────
describe('Register page — rendering', () => {
  it('renders the name field', () => {
    renderRegister();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('renders the email field', () => {
    renderRegister();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('renders the password field', () => {
    renderRegister();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('renders the Create Account button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders a link to the login page', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /sign in here/i })).toHaveAttribute('href', '/login');
  });
});

// ─────────────────────────────────────────────────
// Password strength meter
// ─────────────────────────────────────────────────
describe('Register page — password strength meter', () => {
  it('does not show strength indicator when password is empty', () => {
    renderRegister();
    expect(screen.queryByText(/weak|fair|good|strong|excellent/i)).not.toBeInTheDocument();
  });

  it('shows "Weak" for a very short password', async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'abc');
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('shows "Strong" for a complex password', async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'MyP@ssw0rd123');
    expect(screen.getByText(/strong|excellent/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────
// Show/hide password toggle
// ─────────────────────────────────────────────────
describe('Register page — password visibility toggle', () => {
  it('password field is hidden by default', () => {
    renderRegister();
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
  });

  it('shows password when eye button is clicked', async () => {
    renderRegister();
    const toggle = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggle);
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'text');
  });

  it('hides password again on second click', async () => {
    renderRegister();
    const toggle = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggle);
    const toggle2 = screen.getByRole('button', { name: /hide password/i });
    await userEvent.click(toggle2);
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
  });
});

// ─────────────────────────────────────────────────
// Submission
// ─────────────────────────────────────────────────
describe('Register page — form submission', () => {
  it('calls register() with name, email, and password', async () => {
    mockRegister.mockResolvedValue({});
    renderRegister();

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'SecurePass1!');
    });
  });

  it('navigates to "/" on successful registration', async () => {
    mockRegister.mockResolvedValue({});
    renderRegister();

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'SecurePass1!');
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows success toast on registration', async () => {
    mockRegister.mockResolvedValue({});
    renderRegister();

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Pass1234!');
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('shows error toast on registration failure', async () => {
    mockRegister.mockRejectedValue({ response: { data: { error: 'User already exists' } } });
    renderRegister();

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Pass1234!');
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('User already exists'));
  });

  it('disables the submit button during registration', async () => {
    mockRegister.mockImplementation(() => new Promise(() => {}));
    renderRegister();

    const button = screen.getByRole('button', { name: /create account/i });
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Pass1234!');
    fireEvent.submit(button.closest('form'));

    await waitFor(() => expect(button).toBeDisabled());
  });
});
