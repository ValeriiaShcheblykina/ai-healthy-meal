import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/recipes/SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<SearchBar initialQuery="" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('placeholder', 'Search recipes...');
      expect(input).toHaveAttribute('aria-label', 'Search recipes');
    });

    it('should initialize with initial query value', () => {
      render(<SearchBar initialQuery="pasta" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      expect(input).toHaveValue('pasta');
    });
  });

  describe('User input', () => {
    it('should update input value when user types', () => {
      render(<SearchBar initialQuery="" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      fireEvent.change(input, { target: { value: 'chicken' } });

      expect(input).toHaveValue('chicken');
    });

    it('should debounce search callback', () => {
      render(<SearchBar initialQuery="" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      // Should not be called immediately
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Fast-forward time by 300ms
      vi.advanceTimersByTime(300);

      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    it('should call onSearch with debounced value', () => {
      render(<SearchBar initialQuery="" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      fireEvent.change(input, { target: { value: 'pasta' } });

      vi.advanceTimersByTime(300);

      expect(mockOnSearch).toHaveBeenCalledWith('pasta');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('should debounce multiple rapid changes', () => {
      render(<SearchBar initialQuery="" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      fireEvent.change(input, { target: { value: 'p' } });
      vi.advanceTimersByTime(100);
      fireEvent.change(input, { target: { value: 'pa' } });
      vi.advanceTimersByTime(100);
      fireEvent.change(input, { target: { value: 'pas' } });
      vi.advanceTimersByTime(100);
      fireEvent.change(input, { target: { value: 'past' } });
      vi.advanceTimersByTime(100);
      fireEvent.change(input, { target: { value: 'pasta' } });

      // Should not have been called yet (timer was reset on last change)
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Fast-forward full debounce time after last change (300ms)
      vi.advanceTimersByTime(300);

      expect(mockOnSearch).toHaveBeenCalledWith('pasta');
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('should clear timeout on unmount', () => {
      const { unmount } = render(
        <SearchBar initialQuery="" onSearch={mockOnSearch} />
      );

      const input = screen.getByTestId('recipes-search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      unmount();

      // Fast-forward time
      vi.advanceTimersByTime(300);

      // Should not be called after unmount
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      render(<SearchBar initialQuery="pasta" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      fireEvent.change(input, { target: { value: '' } });

      vi.advanceTimersByTime(300);

      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should handle special characters', () => {
      render(<SearchBar initialQuery="" onSearch={mockOnSearch} />);

      const input = screen.getByTestId('recipes-search-input');
      fireEvent.change(input, { target: { value: 'pasta & sauce' } });

      vi.advanceTimersByTime(300);

      expect(mockOnSearch).toHaveBeenCalledWith('pasta & sauce');
    });
  });
});
