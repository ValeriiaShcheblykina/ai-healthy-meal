import { describe, it, expect } from 'vitest';
import {
  validateRecipeListQueryParams,
  validateRecipeData,
  validateRecipeVariantListQueryParams,
} from '@/lib/validation/recipe.validation';
import { ERROR_CODES } from '@/lib/errors/api-errors';

describe('Recipe Validation', () => {
  describe('validateRecipeListQueryParams', () => {
    it('should validate and normalize default parameters', () => {
      const result = validateRecipeListQueryParams({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 1,
          limit: 20,
          sort: 'created_at',
          order: 'desc',
          search: '',
        });
      }
    });

    it('should validate valid query parameters', () => {
      const result = validateRecipeListQueryParams({
        page: '2',
        limit: '10',
        sort: 'title',
        order: 'asc',
        search: 'pasta',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 2,
          limit: 10,
          sort: 'title',
          order: 'asc',
          search: 'pasta',
        });
      }
    });

    it('should reject invalid page number', () => {
      const result = validateRecipeListQueryParams({
        page: '0',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.details?.page).toBe('must be a positive integer');
      }
    });

    it('should reject negative page number', () => {
      const result = validateRecipeListQueryParams({
        page: '-1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.page).toBe('must be a positive integer');
      }
    });

    it('should reject non-numeric page', () => {
      const result = validateRecipeListQueryParams({
        page: 'abc',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.page).toBe('must be a positive integer');
      }
    });

    it('should reject invalid limit (too small)', () => {
      const result = validateRecipeListQueryParams({
        limit: '0',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.limit).toBe('must be between 1 and 100');
      }
    });

    it('should reject invalid limit (too large)', () => {
      const result = validateRecipeListQueryParams({
        limit: '101',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.limit).toBe('must be between 1 and 100');
      }
    });

    it('should reject invalid sort field', () => {
      const result = validateRecipeListQueryParams({
        sort: 'invalid_field',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.sort).toContain('must be one of');
      }
    });

    it('should reject invalid order value', () => {
      const result = validateRecipeListQueryParams({
        order: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.order).toContain('must be one of');
      }
    });

    it('should reject search query exceeding max length', () => {
      const longSearch = 'a'.repeat(201); // MAX_SEARCH_LENGTH is 200
      const result = validateRecipeListQueryParams({
        search: longSearch,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.search).toContain(
          'must be at most 200 characters'
        );
      }
    });

    it('should trim search query', () => {
      const result = validateRecipeListQueryParams({
        search: '  pasta  ',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('pasta');
      }
    });

    it('should handle empty search string', () => {
      const result = validateRecipeListQueryParams({
        search: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('');
      }
    });

    it('should handle multiple validation errors', () => {
      const result = validateRecipeListQueryParams({
        page: '0',
        limit: '101',
        sort: 'invalid',
        order: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Object.keys(result.error.details || {})).toHaveLength(4);
      }
    });
  });

  describe('validateRecipeData', () => {
    describe('create operation', () => {
      it('should validate valid recipe data for create', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content: 'Recipe instructions',
            is_public: false,
          },
          true
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Test Recipe');
          expect(result.data.content).toBe('Recipe instructions');
          expect(result.data.is_public).toBe(false);
        }
      });

      it('should require title for create', () => {
        const result = validateRecipeData(
          {
            content: 'Recipe instructions',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.title).toBe('is required');
        }
      });

      it('should require at least one content field for create', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.content).toBe(
            'either content or content_json is required'
          );
        }
      });

      it('should accept content_json instead of content for create', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content_json: { ingredients: [], instructions: [] },
          },
          true
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content_json).toBeDefined();
        }
      });

      it('should reject non-string title', () => {
        const result = validateRecipeData(
          {
            title: 123,
            content: 'Recipe instructions',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.title).toBe('must be a string');
        }
      });

      it('should reject empty title', () => {
        const result = validateRecipeData(
          {
            title: '',
            content: 'Recipe instructions',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.title).toBe('cannot be empty');
        }
      });

      it('should reject title with only whitespace', () => {
        const result = validateRecipeData(
          {
            title: '   ',
            content: 'Recipe instructions',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.title).toBe('cannot be empty');
        }
      });

      it('should reject title exceeding max length', () => {
        const longTitle = 'a'.repeat(201); // MAX_TITLE_LENGTH is 200
        const result = validateRecipeData(
          {
            title: longTitle,
            content: 'Recipe instructions',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.title).toContain(
            'must be at most 200 characters'
          );
        }
      });

      it('should trim title', () => {
        const result = validateRecipeData(
          {
            title: '  Test Recipe  ',
            content: 'Recipe instructions',
          },
          true
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Test Recipe');
        }
      });

      it('should reject non-string content', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content: 123,
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.content).toBe('must be a string');
        }
      });

      it('should set content to null for empty trimmed content but require content_json for create', () => {
        // When content is empty whitespace, it becomes null
        // For create operations, we need either content or content_json
        const resultWithoutContentJson = validateRecipeData(
          {
            title: 'Test Recipe',
            content: '   ',
          },
          true
        );

        // Should fail because content becomes null and no content_json provided
        expect(resultWithoutContentJson.success).toBe(false);
        if (!resultWithoutContentJson.success) {
          expect(resultWithoutContentJson.error.details?.content).toBe(
            'either content or content_json is required'
          );
        }

        // Should succeed if content_json is provided
        const resultWithContentJson = validateRecipeData(
          {
            title: 'Test Recipe',
            content: '   ',
            content_json: { ingredients: [], instructions: [] },
          },
          true
        );

        expect(resultWithContentJson.success).toBe(true);
        if (resultWithContentJson.success) {
          expect(resultWithContentJson.data.content).toBeNull();
        }
      });

      it('should reject content exceeding max length', () => {
        const longContent = 'a'.repeat(50001); // MAX_CONTENT_LENGTH is 50000
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content: longContent,
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.content).toContain(
            'must be at most 50000 characters'
          );
        }
      });

      it('should trim content', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content: '  Recipe instructions  ',
          },
          true
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content).toBe('Recipe instructions');
        }
      });

      it('should reject invalid content_json type', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content_json: 'not an object',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.content_json).toBe(
            'must be a valid JSON object'
          );
        }
      });

      it('should accept valid content_json object', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content_json: {
              ingredients: ['flour', 'eggs'],
              instructions: ['Mix', 'Bake'],
            },
          },
          true
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content_json).toEqual({
            ingredients: ['flour', 'eggs'],
            instructions: ['Mix', 'Bake'],
          });
        }
      });

      it('should reject non-boolean is_public', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content: 'Recipe instructions',
            is_public: 'true',
          },
          true
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.is_public).toBe('must be a boolean');
        }
      });

      it('should default is_public to false', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content: 'Recipe instructions',
          },
          true
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_public).toBe(false);
        }
      });

      it('should accept is_public as true', () => {
        const result = validateRecipeData(
          {
            title: 'Test Recipe',
            content: 'Recipe instructions',
            is_public: true,
          },
          true
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_public).toBe(true);
        }
      });
    });

    describe('update operation', () => {
      it('should allow partial updates without title', () => {
        const result = validateRecipeData(
          {
            content: 'Updated instructions',
          },
          false
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content).toBe('Updated instructions');
          expect(result.data.title).toBeUndefined();
        }
      });

      it('should allow updating only is_public', () => {
        const result = validateRecipeData(
          {
            is_public: true,
          },
          false
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_public).toBe(true);
        }
      });

      it('should validate title when provided in update', () => {
        const result = validateRecipeData(
          {
            title: '',
          },
          false
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details?.title).toBe('cannot be empty');
        }
      });

      it('should allow null content in update', () => {
        const result = validateRecipeData(
          {
            content: null,
          },
          false
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content).toBeNull();
        }
      });
    });
  });

  describe('validateRecipeVariantListQueryParams', () => {
    it('should validate and normalize default parameters', () => {
      const result = validateRecipeVariantListQueryParams({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 1,
          limit: 20,
          sort: 'created_at',
          order: 'desc',
        });
      }
    });

    it('should validate valid variant query parameters', () => {
      const result = validateRecipeVariantListQueryParams({
        page: '2',
        limit: '10',
        sort: 'created_at',
        order: 'asc',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 2,
          limit: 10,
          sort: 'created_at',
          order: 'asc',
        });
      }
    });

    it('should reject invalid page number', () => {
      const result = validateRecipeVariantListQueryParams({
        page: '0',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.page).toBe('must be a positive integer');
      }
    });

    it('should reject invalid limit', () => {
      const result = validateRecipeVariantListQueryParams({
        limit: '101',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.limit).toBe('must be between 1 and 100');
      }
    });

    it('should reject invalid sort field', () => {
      const result = validateRecipeVariantListQueryParams({
        sort: 'invalid_field',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.sort).toContain('must be one of');
      }
    });

    it('should reject invalid order value', () => {
      const result = validateRecipeVariantListQueryParams({
        order: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details?.order).toContain('must be one of');
      }
    });

    it('should handle multiple validation errors', () => {
      const result = validateRecipeVariantListQueryParams({
        page: '0',
        limit: '101',
        sort: 'invalid',
        order: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Object.keys(result.error.details || {})).toHaveLength(4);
      }
    });
  });
});
