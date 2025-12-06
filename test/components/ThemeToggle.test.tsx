import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  const originalMatchMedia = window.matchMedia;
  const originalDocumentElement = document.documentElement;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();

    // Reset document classes
    document.documentElement.className = '';

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original implementations
    // Note: localStorage is readonly, so we just clear it instead of restoring
    localStorage.clear();
    window.matchMedia = originalMatchMedia;
    document.documentElement.className = originalDocumentElement.className;
    vi.restoreAllMocks();
  });

  describe('Initial rendering and hydration', () => {
    it('should render theme button after mount', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to (light|dark) mode/i,
        });
        expect(button).toBeInTheDocument();
      });
    });

    it('should have button with proper styling', async () => {
      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to (light|dark) mode/i,
        });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('h-9', 'w-9');
      });
    });
  });

  describe('Theme initialization', () => {
    it('should use light theme when no localStorage value and system prefers light', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)' ? false : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to dark mode/i,
        });
        expect(button).toBeInTheDocument();
        expect(document.documentElement).not.toHaveClass('dark');
      });
    });

    it('should use dark theme when system prefers dark', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to light mode/i,
        });
        expect(button).toBeInTheDocument();
        expect(document.documentElement).toHaveClass('dark');
      });
    });

    it('should use stored theme from localStorage', async () => {
      localStorage.setItem('theme', 'dark');

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to light mode/i,
        });
        expect(button).toBeInTheDocument();
        expect(document.documentElement).toHaveClass('dark');
      });
    });

    it('should prioritize localStorage over system preference', async () => {
      localStorage.setItem('theme', 'light');

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to dark mode/i,
        });
        expect(button).toBeInTheDocument();
        expect(document.documentElement).not.toHaveClass('dark');
      });
    });
  });

  describe('Theme toggle functionality', () => {
    it('should toggle from light to dark', async () => {
      const user = userEvent.setup();
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /switch to dark mode/i })
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', {
        name: /switch to dark mode/i,
      });
      await user.click(button);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(
          screen.getByRole('button', { name: /switch to light mode/i })
        ).toBeInTheDocument();
      });
    });

    it('should toggle from dark to light', async () => {
      const user = userEvent.setup();
      localStorage.setItem('theme', 'dark');

      render(<ThemeToggle />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /switch to light mode/i })
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', {
        name: /switch to light mode/i,
      });
      await user.click(button);

      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass('dark');
        expect(localStorage.getItem('theme')).toBe('light');
        expect(
          screen.getByRole('button', { name: /switch to dark mode/i })
        ).toBeInTheDocument();
      });
    });

    it('should update localStorage when toggling', async () => {
      const user = userEvent.setup();
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /switch to dark mode/i })
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', {
        name: /switch to dark mode/i,
      });
      await user.click(button);

      await waitFor(() => {
        expect(localStorage.getItem('theme')).toBe('dark');
      });

      await user.click(button);

      await waitFor(() => {
        expect(localStorage.getItem('theme')).toBe('light');
      });
    });

    it('should update DOM class when toggling', async () => {
      const user = userEvent.setup();
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass('dark');
      });

      const button = screen.getByRole('button', {
        name: /switch to dark mode/i,
      });
      await user.click(button);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });

      await user.click(button);

      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass('dark');
      });
    });
  });

  describe('Icon rendering', () => {
    it('should show moon icon in light mode', async () => {
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to dark mode/i,
        });
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
        // Moon icon has a path with "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
        expect(svg?.innerHTML).toContain('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z');
      });
    });

    it('should show sun icon in dark mode', async () => {
      localStorage.setItem('theme', 'dark');

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to light mode/i,
        });
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
        // Sun icon has a circle and multiple paths
        expect(svg?.innerHTML).toContain('<circle');
        expect(svg?.innerHTML).toContain('M12 2v2');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label in light mode', async () => {
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to dark mode/i,
        });
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      });
    });

    it('should have proper aria-label in dark mode', async () => {
      localStorage.setItem('theme', 'dark');

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to light mode/i,
        });
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      });
    });

    it('should have screen reader text', async () => {
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        const srText = screen.getByText('Switch to dark mode', {
          selector: '.sr-only',
        });
        expect(srText).toBeInTheDocument();
        expect(srText).toHaveClass('sr-only');
      });
    });

    it('should have aria-hidden on icons', async () => {
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to dark mode/i,
        });
        const svg = button.querySelector('svg[aria-hidden="true"]');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Button styling', () => {
    it('should have correct button classes', async () => {
      localStorage.setItem('theme', 'light');

      render(<ThemeToggle />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /switch to dark mode/i,
        });
        expect(button).toHaveClass('h-9', 'w-9');
      });
    });
  });

  describe('Multiple toggles', () => {
    it('should handle multiple theme toggles independently', async () => {
      const user = userEvent.setup();
      localStorage.setItem('theme', 'light');

      const { rerender } = render(<ThemeToggle />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /switch to dark mode/i })
        ).toBeInTheDocument();
      });

      const button1 = screen.getByRole('button', {
        name: /switch to dark mode/i,
      });
      await user.click(button1);

      await waitFor(() => {
        expect(localStorage.getItem('theme')).toBe('dark');
      });

      // Rerender to simulate second component instance
      rerender(<ThemeToggle />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /switch to light mode/i })
        ).toBeInTheDocument();
        expect(document.documentElement).toHaveClass('dark');
      });
    });
  });
});
