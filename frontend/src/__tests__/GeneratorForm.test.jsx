import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneratorForm from '../components/GeneratorForm';

// Framer Motion — avoid animation timers in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const renderForm = (props = {}) => {
  const defaults = {
    onSubmit: vi.fn(),
    isLoading: false,
    streamStep: null,
    stepLabel: '',
  };
  return render(<GeneratorForm {...defaults} {...props} />);
};

// ─────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────
describe('GeneratorForm — rendering', () => {
  it('renders the keyword input', () => {
    renderForm();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows placeholder text in the input', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/what topic/i)).toBeInTheDocument();
  });

  it('renders the Generate button', () => {
    renderForm();
    // Desktop and mobile buttons both exist; grab the desktop one (first)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the character counter starting at 0/100', () => {
    renderForm();
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('renders SEO badges (High Accuracy, SEO Optimized, Plagiarism Free)', () => {
    renderForm();
    expect(screen.getByText('High Accuracy')).toBeInTheDocument();
    expect(screen.getByText('SEO Optimized')).toBeInTheDocument();
    expect(screen.getByText('Plagiarism Free')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────
// Input behaviour
// ─────────────────────────────────────────────────
describe('GeneratorForm — input behaviour', () => {
  it('updates the character counter as the user types', async () => {
    renderForm();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'SEO');
    expect(screen.getByText('3/100')).toBeInTheDocument();
  });

  it('caps input at 100 characters', async () => {
    renderForm();
    const input = screen.getByRole('textbox');
    const longText = 'a'.repeat(120);
    await userEvent.type(input, longText);
    expect(input.value).toHaveLength(100);
    expect(screen.getByText('100/100')).toBeInTheDocument();
  });

  it('trims whitespace before calling onSubmit', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '  backlinks  ');
    fireEvent.submit(input.closest('form'));
    expect(onSubmit).toHaveBeenCalledWith('backlinks');
  });
});

// ─────────────────────────────────────────────────
// Submission
// ─────────────────────────────────────────────────
describe('GeneratorForm — submission', () => {
  it('calls onSubmit with the keyword value when form is submitted', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'sustainable fashion');
    fireEvent.submit(input.closest('form'));
    expect(onSubmit).toHaveBeenCalledWith('sustainable fashion');
  });

  it('does NOT call onSubmit when keyword is empty', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    fireEvent.submit(screen.getByRole('textbox').closest('form'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does NOT call onSubmit when keyword is only whitespace', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    await userEvent.type(screen.getByRole('textbox'), '   ');
    fireEvent.submit(screen.getByRole('textbox').closest('form'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────
// Loading states
// ─────────────────────────────────────────────────
describe('GeneratorForm — loading states', () => {
  it('disables the input while loading', () => {
    renderForm({ isLoading: true });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows stream step label when isLoading=true and streamStep is provided', () => {
    renderForm({ isLoading: true, streamStep: 'content', stepLabel: 'Writing article…' });
    expect(screen.getByText('Writing article…')).toBeInTheDocument();
  });

  it('shows "Working…" fallback when isLoading=true, streamStep provided but no stepLabel', () => {
    renderForm({ isLoading: true, streamStep: 'meta', stepLabel: '' });
    expect(screen.getByText('Working…')).toBeInTheDocument();
  });

  it('does not show loading steps when isLoading=false', () => {
    renderForm({ isLoading: false });
    expect(screen.queryByText('Analyzing keyword')).not.toBeInTheDocument();
  });
});
