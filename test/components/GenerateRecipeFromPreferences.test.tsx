import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerateRecipeFromPreferences } from '@/components/GenerateRecipeFromPreferences';

// Store mocks globally for access in mock factory
declare global {
  // eslint-disable-next-line no-var
  var __mockGetCurrentUser: ReturnType<typeof vi.fn> | undefined;
  // eslint-disable-next-line no-var
  var __mockGenerateRecipeFromPreferences: ReturnType<typeof vi.fn> | undefined;
}

// Mock ProfileClientService - must use function to return class for hoisting
vi.mock('@/lib/services/client/profile.client.service', () => {
  const mockGetCurrentUser = vi.fn();
  const mockGenerateRecipeFromPreferences = vi.fn();
  global.__mockGetCurrentUser = mockGetCurrentUser;
  global.__mockGenerateRecipeFromPreferences =
    mockGenerateRecipeFromPreferences;

  return {
    ProfileClientService: class {
      getCurrentUser = mockGetCurrentUser;
      generateRecipeFromPreferences = mockGenerateRecipeFromPreferences;
    },
  };
});

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('GenerateRecipeFromPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    global.__mockGetCurrentUser?.mockClear();
    global.__mockGenerateRecipeFromPreferences?.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering based on preferences', () => {
    it('should not render when user has no preferences', async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: null,
        },
      });

      const { container } = render(<GenerateRecipeFromPreferences />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should not render when profile exists but has no preferences', async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: [],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });

      const { container } = render(<GenerateRecipeFromPreferences />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should render when user has diets', async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: ['vegan'],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should render when user has allergens', async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: [],
            allergens: ['nuts'],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should render when user has disliked ingredients', async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: [],
            allergens: [],
            dislikedIngredients: ['onions'],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should render when user has calorie target', async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: [],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: 500,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should handle error when checking preferences', async () => {
      global.__mockGetCurrentUser?.mockRejectedValue(
        new Error('Failed to fetch')
      );

      const { container } = render(<GenerateRecipeFromPreferences />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Button rendering and props', () => {
    beforeEach(async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: ['vegan'],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });
    });

    it('should render button with default props', async () => {
      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          const button = screen.getByTestId(
            'generate-recipe-from-preferences-button'
          );
          expect(button).toBeInTheDocument();
          expect(button).toHaveTextContent(
            'Generate Recipe from My Preferences'
          );
        },
        { timeout: 3000 }
      );
    });

    it('should apply custom className', async () => {
      render(<GenerateRecipeFromPreferences className="custom-class" />);

      await waitFor(
        () => {
          const button = screen.getByTestId(
            'generate-recipe-from-preferences-button'
          );
          expect(button).toHaveClass('custom-class');
        },
        { timeout: 3000 }
      );
    });

    it('should apply custom variant', async () => {
      render(<GenerateRecipeFromPreferences variant="outline" />);

      await waitFor(
        () => {
          const button = screen.getByTestId(
            'generate-recipe-from-preferences-button'
          );
          expect(button).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should apply custom size', async () => {
      render(<GenerateRecipeFromPreferences size="lg" />);

      await waitFor(
        () => {
          const button = screen.getByTestId(
            'generate-recipe-from-preferences-button'
          );
          expect(button).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should disable button when disabled prop is true', async () => {
      render(<GenerateRecipeFromPreferences disabled />);

      await waitFor(
        () => {
          const button = screen.getByTestId(
            'generate-recipe-from-preferences-button'
          );
          expect(button).toBeDisabled();
        },
        { timeout: 3000 }
      );
    });

    it('should show mobile text on small screens', async () => {
      // Mock window.matchMedia for small screen
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(max-width: 640px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          const button = screen.getByTestId(
            'generate-recipe-from-preferences-button'
          );
          // Should contain the mobile text span
          expect(button).toHaveTextContent('Generate Recipe');
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Generate recipe functionality', () => {
    beforeEach(async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: ['vegan'],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });
    });

    it('should generate recipe and redirect on button click', async () => {
      const user = userEvent.setup();
      const redirectUrl = '/recipes/new?generated=true&title=Test+Recipe';

      global.__mockGenerateRecipeFromPreferences?.mockResolvedValue(
        redirectUrl
      );

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const button = screen.getByTestId(
        'generate-recipe-from-preferences-button'
      );
      await user.click(button);

      await waitFor(() => {
        expect(
          global.__mockGenerateRecipeFromPreferences
        ).toHaveBeenCalledTimes(1);
        expect(mockLocation.href).toBe(redirectUrl);
      });
    });

    it('should show loading state during generation', async () => {
      const user = userEvent.setup();
      const redirectUrl = '/recipes/new?generated=true&title=Test+Recipe';

      // Delay the promise resolution to test loading state
      let resolvePromise: ((value: string) => void) | undefined;
      const delayedPromise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      global.__mockGenerateRecipeFromPreferences?.mockReturnValue(
        delayedPromise
      );

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const button = screen.getByTestId(
        'generate-recipe-from-preferences-button'
      );
      await user.click(button);

      // Check loading state
      await waitFor(() => {
        expect(button).toHaveTextContent('Generating...');
        expect(button).toBeDisabled();
      });

      // Resolve the promise
      if (resolvePromise) {
        resolvePromise(redirectUrl);
      }
      await waitFor(() => {
        expect(mockLocation.href).toBe(redirectUrl);
      });
    });

    it('should display error message on generation failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to generate recipe';

      global.__mockGenerateRecipeFromPreferences?.mockRejectedValue(
        new Error(errorMessage)
      );

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const button = screen.getByTestId(
        'generate-recipe-from-preferences-button'
      );
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
      });

      // Button should be enabled again after error
      expect(button).not.toBeDisabled();
    });

    it('should handle non-Error exceptions', async () => {
      const user = userEvent.setup();

      global.__mockGenerateRecipeFromPreferences?.mockRejectedValue(
        'String error'
      );

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const button = screen.getByTestId(
        'generate-recipe-from-preferences-button'
      );
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(
          'An unexpected error occurred'
        );
      });
    });

    it('should clear error when generating again', async () => {
      const user = userEvent.setup();
      const redirectUrl = '/recipes/new?generated=true&title=Test+Recipe';

      // First call fails
      global.__mockGenerateRecipeFromPreferences
        ?.mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(redirectUrl);

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const button = screen.getByTestId(
        'generate-recipe-from-preferences-button'
      );

      // First click - error
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Second click - success
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(mockLocation.href).toBe(redirectUrl);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      global.__mockGetCurrentUser?.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailConfirmed: true,
          profile: {
            displayName: 'Test User',
            diets: ['vegan'],
            allergens: [],
            dislikedIngredients: [],
            calorieTarget: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      });
    });

    it('should have proper aria-label', async () => {
      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          const button = screen.getByTestId(
            'generate-recipe-from-preferences-button'
          );
          expect(button).toHaveAttribute(
            'aria-label',
            'Generate recipe based on your profile preferences'
          );
        },
        { timeout: 3000 }
      );
    });

    it('should have aria-live region for errors', async () => {
      const user = userEvent.setup();

      global.__mockGenerateRecipeFromPreferences?.mockRejectedValue(
        new Error('Test error')
      );

      render(<GenerateRecipeFromPreferences />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('generate-recipe-from-preferences-button')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const button = screen.getByTestId(
        'generate-recipe-from-preferences-button'
      );
      await user.click(button);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });
});
