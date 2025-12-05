import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (class name utility)', () => {
  describe('Basic class merging', () => {
    it('should merge multiple string classes', () => {
      const result = cn('foo', 'bar', 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle single class', () => {
      const result = cn('single');
      expect(result).toBe('single');
    });

    it('should handle empty strings', () => {
      const result = cn('foo', '', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle undefined and null values', () => {
      const result = cn('foo', undefined, 'bar', null, 'baz');
      expect(result).toBe('foo bar baz');
    });
  });

  describe('Tailwind class conflict resolution', () => {
    it('should resolve conflicting padding classes', () => {
      const result = cn('p-4', 'p-8');
      // tailwind-merge should keep the last one
      expect(result).toBe('p-8');
    });

    it('should resolve conflicting margin classes', () => {
      const result = cn('m-2', 'm-4', 'm-6');
      expect(result).toBe('m-6');
    });

    it('should resolve conflicting text color classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should resolve conflicting background color classes', () => {
      const result = cn('bg-gray-100', 'bg-white');
      expect(result).toBe('bg-white');
    });

    it('should not conflict non-conflicting classes', () => {
      const result = cn('p-4', 'm-2', 'text-red-500');
      expect(result).toContain('p-4');
      expect(result).toContain('m-2');
      expect(result).toContain('text-red-500');
    });
  });

  describe('Conditional classes', () => {
    it('should handle boolean conditionals', () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn('base', isActive && 'active', isDisabled && 'disabled');
      expect(result).toBe('base active');
    });

    it('should handle ternary conditionals', () => {
      const isPrimary = true;
      const result = cn('button', isPrimary ? 'bg-blue-500' : 'bg-gray-500');
      expect(result).toBe('button bg-blue-500');
    });

    it('should handle multiple conditionals', () => {
      const isActive = true;
      const isLarge = true;
      const isDisabled = false;

      const result = cn(
        'base',
        isActive && 'active',
        isLarge && 'large',
        isDisabled && 'disabled'
      );
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).toContain('large');
      expect(result).not.toContain('disabled');
    });
  });

  describe('Array and object inputs', () => {
    it('should handle array inputs', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle nested arrays', () => {
      const result = cn(['foo', ['bar', 'baz']], 'qux');
      expect(result).toBe('foo bar baz qux');
    });

    it('should handle object inputs (conditional classes)', () => {
      const result = cn({
        'base-class': true,
        'conditional-class': true,
        'false-class': false,
      });
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('false-class');
    });

    it('should handle mixed inputs', () => {
      const result = cn(
        'base',
        ['array-class', 'array-class-2'],
        {
          'object-class': true,
          'object-false': false,
        },
        'string-class'
      );
      expect(result).toContain('base');
      expect(result).toContain('array-class');
      expect(result).toContain('array-class-2');
      expect(result).toContain('object-class');
      expect(result).not.toContain('object-false');
      expect(result).toContain('string-class');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle all falsy values', () => {
      const result = cn(false, null, undefined, '', 0);
      expect(result).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      const result = cn('  ', 'foo', '   ');
      expect(result).toBe('foo');
    });

    it('should handle very long class lists', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result).toContain('class-0');
      expect(result).toContain('class-99');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle button component classes', () => {
      const variant = 'primary';
      const size = 'large';
      const disabled = false;

      const result = cn(
        'button',
        'px-4',
        'py-2',
        'rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-500 text-black',
        size === 'large' && 'text-lg',
        size === 'small' && 'text-sm',
        disabled && 'opacity-50 cursor-not-allowed'
      );

      expect(result).toContain('button');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('rounded');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).toContain('text-lg');
      expect(result).not.toContain('opacity-50');
    });

    it('should handle responsive classes', () => {
      const result = cn('base', 'md:p-4', 'lg:p-6', 'xl:p-8');

      expect(result).toContain('base');
      expect(result).toContain('md:p-4');
      expect(result).toContain('lg:p-6');
      expect(result).toContain('xl:p-8');
    });

    it('should handle conflicting responsive classes', () => {
      const result = cn('p-2', 'md:p-4', 'md:p-6');
      // Should keep the last conflicting responsive class
      expect(result).toContain('p-2');
      expect(result).toContain('md:p-6');
      expect(result).not.toContain('md:p-4');
    });
  });
});
