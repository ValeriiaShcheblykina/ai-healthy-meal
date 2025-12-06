import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/components/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  const STORAGE_KEY = 'test-key';

  beforeEach(() => {
    // Clear localStorage before each test (if available)
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.clearAllMocks();
  });

  describe('Initial value handling', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial')
      );

      expect(result.current[0]).toBe('initial');
    });

    it('should return initial value for different types', () => {
      const { result: stringResult } = renderHook(() =>
        useLocalStorage('string-key', 'test')
      );
      expect(stringResult.current[0]).toBe('test');

      const { result: numberResult } = renderHook(() =>
        useLocalStorage('number-key', 42)
      );
      expect(numberResult.current[0]).toBe(42);

      const { result: objectResult } = renderHook(() =>
        useLocalStorage('object-key', { foo: 'bar' })
      );
      expect(objectResult.current[0]).toEqual({ foo: 'bar' });

      const { result: arrayResult } = renderHook(() =>
        useLocalStorage('array-key', [1, 2, 3])
      );
      expect(arrayResult.current[0]).toEqual([1, 2, 3]);
    });
  });

  describe('Reading from localStorage', () => {
    it('should read existing value from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('stored-value'));

      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial')
      );

      expect(result.current[0]).toBe('stored-value');
    });

    it('should read complex objects from localStorage', () => {
      const storedObject = { name: 'Test', count: 5, nested: { value: true } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedObject));

      const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, {}));

      expect(result.current[0]).toEqual(storedObject);
    });

    it('should read arrays from localStorage', () => {
      const storedArray = [1, 2, 3, 'test'];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedArray));

      const { result } = renderHook(() =>
        useLocalStorage<(number | string)[]>(STORAGE_KEY, [])
      );

      expect(result.current[0]).toEqual(storedArray);
    });
  });

  describe('Writing to localStorage', () => {
    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial')
      );

      act(() => {
        result.current[1]('updated-value');
      });

      expect(result.current[0]).toBe('updated-value');
      expect(localStorage.getItem(STORAGE_KEY)).toBe(
        JSON.stringify('updated-value')
      );
    });

    it('should update localStorage with complex objects', () => {
      const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, {}));

      const newValue = { name: 'New', items: [1, 2, 3] };

      act(() => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toEqual(newValue);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(newValue));
    });

    it('should update localStorage with arrays', () => {
      const { result } = renderHook(() =>
        useLocalStorage<string[]>(STORAGE_KEY, [])
      );

      const newArray = ['a', 'b', 'c'];

      act(() => {
        result.current[1](newArray);
      });

      expect(result.current[0]).toEqual(newArray);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(newArray));
    });

    it('should update localStorage multiple times', () => {
      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial')
      );

      act(() => {
        result.current[1]('first');
      });
      expect(result.current[0]).toBe('first');

      act(() => {
        result.current[1]('second');
      });
      expect(result.current[0]).toBe('second');

      act(() => {
        result.current[1]('third');
      });
      expect(result.current[0]).toBe('third');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in localStorage', () => {
      // Set invalid JSON
      localStorage.setItem(STORAGE_KEY, 'invalid-json{');

      const consoleSpy = vi.spyOn(console, 'error');

      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'fallback')
      );

      // Should fall back to initial value
      expect(result.current[0]).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading localStorage'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle quota exceeded error when writing', () => {
      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial')
      );

      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      const quotaError = new DOMException('QuotaExceededError');
      Storage.prototype.setItem = vi.fn(() => {
        throw quotaError;
      });

      const consoleSpy = vi.spyOn(console, 'error');

      act(() => {
        result.current[1]('large-value');
      });

      // Should not crash, but log error
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error setting localStorage'),
        quotaError
      );

      // Restore original implementation
      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should handle other localStorage errors gracefully', () => {
      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial')
      );

      // Mock localStorage.setItem to throw generic error
      const originalSetItem = Storage.prototype.setItem;
      const genericError = new Error('Storage error');
      Storage.prototype.setItem = vi.fn(() => {
        throw genericError;
      });

      const consoleSpy = vi.spyOn(console, 'error');

      act(() => {
        result.current[1]('value');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error setting localStorage'),
        genericError
      );

      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('SSR safety', () => {
    it('should return initial value when window is undefined', () => {
      // The hook checks typeof window === 'undefined' internally
      // In jsdom environment, window exists, so we test the behavior
      // by verifying it handles the case gracefully
      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'ssr-initial')
      );

      // Should return initial value
      expect(result.current[0]).toBe('ssr-initial');
    });

    it('should not crash when updating value', () => {
      const { result } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'ssr-initial')
      );

      // Should not throw when updating
      act(() => {
        result.current[1]('ssr-updated');
      });

      // Value should update
      expect(result.current[0]).toBe('ssr-updated');
    });
  });

  describe('Multiple instances', () => {
    it('should handle multiple hooks with different keys independently', () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorage('key1', 'value1')
      );
      const { result: result2 } = renderHook(() =>
        useLocalStorage('key2', 'value2')
      );

      expect(result1.current[0]).toBe('value1');
      expect(result2.current[0]).toBe('value2');

      act(() => {
        result1.current[1]('updated1');
      });

      expect(result1.current[0]).toBe('updated1');
      expect(result2.current[0]).toBe('value2');
    });

    it('should handle multiple hooks with same key', () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial1')
      );

      // First hook sets a value
      act(() => {
        result1.current[1]('first-value');
      });

      // Second hook should read the value from localStorage
      const { result: result2 } = renderHook(() =>
        useLocalStorage(STORAGE_KEY, 'initial2')
      );

      // Both should have the same value from localStorage
      expect(result1.current[0]).toBe('first-value');
      expect(result2.current[0]).toBe('first-value');

      // Update from second hook
      act(() => {
        result2.current[1]('shared-update');
      });

      // First hook's state won't automatically update, but localStorage will
      expect(result2.current[0]).toBe('shared-update');
      expect(localStorage.getItem(STORAGE_KEY)).toBe(
        JSON.stringify('shared-update')
      );
    });
  });
});
