import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeService } from '@/lib/services/recipe.service';
import type { RecipeEntity, RecipeVariantEntity } from '@/types';
import type { Mock } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

type MockSupabaseClient = {
  from: Mock;
  rpc: Mock;
};

describe('RecipeService', () => {
  let mockSupabase: MockSupabaseClient;
  let service: RecipeService;

  // Helper to create a chainable query builder mock
  function createQueryBuilder() {
    const chainable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn(),
    } as {
      select: Mock;
      insert: Mock;
      update: Mock;
      delete: Mock;
      eq: Mock;
      neq: Mock;
      is: Mock;
      order: Mock;
      range: Mock;
      or: Mock;
      single: Mock;
      then: Mock;
    };
    return chainable;
  }

  beforeEach(() => {
    // Create a fresh mock Supabase client for each test
    // Each call to from() returns a new chainable query builder
    mockSupabase = {
      from: vi.fn(() => createQueryBuilder()),
      rpc: vi.fn(),
    };

    service = new RecipeService(
      mockSupabase as unknown as SupabaseClient<Database>
    );
    vi.clearAllMocks();
  });

  describe('listRecipes', () => {
    it('should list recipes with pagination', async () => {
      const mockRecipes: RecipeEntity[] = [
        {
          id: 'recipe-1',
          title: 'Test Recipe',
          content: 'Recipe content',
          content_json: null,
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          deleted_at: null,
          content_tsv: null,
          is_public: false,
        },
      ];

      // Create a properly chained query builder
      const queryBuilder = createQueryBuilder();
      // Setup the chain - each method returns the queryBuilder for chaining
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.order.mockReturnValue(queryBuilder);
      // range is the final method that returns the promise
      queryBuilder.range.mockResolvedValue({
        data: mockRecipes,
        error: null,
        count: 1,
      });

      // Make from() return our configured query builder
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.listRecipes({
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: '',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('recipe-1');
      expect(result.data[0]).not.toHaveProperty('user_id');
      expect(result.data[0]).not.toHaveProperty('deleted_at');
      expect(result.data[0]).not.toHaveProperty('content_tsv');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
    });

    it('should apply search filter when provided', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.order.mockReturnValue(queryBuilder);
      // range returns the query builder for chaining (before or is called)
      queryBuilder.range.mockReturnValue(queryBuilder);
      // or also returns the query builder
      queryBuilder.or.mockReturnValue(queryBuilder);
      // Make the query builder thenable so await works
      queryBuilder.then = vi.fn((resolve) => {
        resolve({
          data: [],
          error: null,
          count: 0,
        });
        return Promise.resolve({
          data: [],
          error: null,
          count: 0,
        });
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      await service.listRecipes({
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
        search: 'pasta',
      });

      expect(queryBuilder.or).toHaveBeenCalledWith(
        'title.ilike.%pasta%,content.ilike.%pasta%'
      );
    });

    it('should handle database errors', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.order.mockReturnValue(queryBuilder);
      queryBuilder.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(
        service.listRecipes({
          page: 1,
          limit: 20,
          sort: 'created_at',
          order: 'desc',
          search: '',
        })
      ).rejects.toThrow();
    });

    it('should calculate pagination correctly', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.order.mockReturnValue(queryBuilder);
      queryBuilder.range.mockResolvedValue({
        data: [],
        error: null,
        count: 25,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.listRecipes({
        page: 2,
        limit: 10,
        sort: 'created_at',
        order: 'desc',
        search: '',
      });

      expect(result.pagination.total).toBe(25);
      expect(result.pagination.total_pages).toBe(3);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getRecipe', () => {
    it('should return recipe by id', async () => {
      const mockRecipe: RecipeEntity = {
        id: 'recipe-1',
        title: 'Test Recipe',
        content: 'Recipe content',
        content_json: null,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        content_tsv: null,
        is_public: false,
      };

      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: mockRecipe,
        error: null,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecipe('recipe-1');

      expect(result).toEqual(mockRecipe);
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'recipe-1');
    });

    it('should return null when recipe not found', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecipe('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(service.getRecipe('recipe-1')).rejects.toThrow();
    });
  });

  describe('createRecipe', () => {
    it('should create a new recipe', async () => {
      const mockRecipe: RecipeEntity = {
        id: 'recipe-1',
        title: 'New Recipe',
        content: 'Recipe content',
        content_json: null,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        content_tsv: null,
        is_public: false,
      };

      const queryBuilder = createQueryBuilder();
      queryBuilder.insert.mockReturnValue(queryBuilder);
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: mockRecipe,
        error: null,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.createRecipe('user-1', {
        title: 'New Recipe',
        content: 'Recipe content',
        content_json: null,
        is_public: false,
      });

      expect(result).toEqual(mockRecipe);
      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Recipe',
          content: 'Recipe content',
          user_id: 'user-1',
        })
      );
    });

    it('should handle database errors on create', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.insert.mockReturnValue(queryBuilder);
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(
        service.createRecipe('user-1', {
          title: 'New Recipe',
          content: 'Recipe content',
          content_json: null,
          is_public: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateRecipe', () => {
    it('should update an existing recipe', async () => {
      const mockRecipe: RecipeEntity = {
        id: 'recipe-1',
        title: 'Updated Recipe',
        content: 'Updated content',
        content_json: null,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        deleted_at: null,
        content_tsv: null,
        is_public: false,
      };

      const queryBuilder = createQueryBuilder();
      queryBuilder.update.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: mockRecipe,
        error: null,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.updateRecipe('recipe-1', {
        title: 'Updated Recipe',
        content: 'Updated content',
      });

      expect(result).toEqual(mockRecipe);
      expect(queryBuilder.update).toHaveBeenCalledWith({
        title: 'Updated Recipe',
        content: 'Updated content',
      });
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'recipe-1');
    });

    it('should handle database errors on update', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.update.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(
        service.updateRecipe('recipe-1', {
          title: 'Updated Recipe',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteRecipe', () => {
    it('should soft delete a recipe', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      await service.deleteRecipe('recipe-1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('soft_delete_recipe', {
        recipe_id: 'recipe-1',
      });
    });

    it('should throw error when recipe not found', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      await expect(service.deleteRecipe('non-existent')).rejects.toThrow();
    });

    it('should handle database errors on delete', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.deleteRecipe('recipe-1')).rejects.toThrow();
    });
  });

  describe('listRecipeVariants', () => {
    it('should list recipe variants with pagination', async () => {
      const mockVariants: RecipeVariantEntity[] = [
        {
          id: 'variant-1',
          recipe_id: 'recipe-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          deleted_at: null,
          created_by: null,
          model: null,
          output_json: null,
          output_text: null,
          parent_variant_id: null,
          preferences_snapshot: null,
          prompt: null,
        },
      ];

      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.order.mockReturnValue(queryBuilder);
      queryBuilder.range.mockResolvedValue({
        data: mockVariants,
        error: null,
        count: 1,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.listRecipeVariants('recipe-1', {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('variant-1');
      expect(result.data[0]).not.toHaveProperty('deleted_at');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
    });

    it('should handle database errors', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.order.mockReturnValue(queryBuilder);
      queryBuilder.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(
        service.listRecipeVariants('recipe-1', {
          page: 1,
          limit: 20,
          sort: 'created_at',
          order: 'desc',
        })
      ).rejects.toThrow();
    });
  });

  describe('getRecipeVariant', () => {
    it('should return variant by id', async () => {
      const mockVariant: RecipeVariantEntity = {
        id: 'variant-1',
        recipe_id: 'recipe-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        created_by: null,
        model: null,
        output_json: null,
        output_text: null,
        parent_variant_id: null,
        preferences_snapshot: null,
        prompt: null,
      };

      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: mockVariant,
        error: null,
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecipeVariant('recipe-1', 'variant-1');

      expect(result).toEqual(mockVariant);
    });

    it('should return null when variant not found', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecipeVariant('recipe-1', 'non-existent');

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      const queryBuilder = createQueryBuilder();
      queryBuilder.select.mockReturnValue(queryBuilder);
      queryBuilder.eq.mockReturnValue(queryBuilder);
      queryBuilder.is.mockReturnValue(queryBuilder);
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue(queryBuilder);

      await expect(
        service.getRecipeVariant('recipe-1', 'variant-1')
      ).rejects.toThrow();
    });
  });

  describe('deleteRecipeVariant', () => {
    it('should soft delete a variant', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      await service.deleteRecipeVariant('recipe-1', 'variant-1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'soft_delete_recipe_variant',
        {
          p_recipe_id: 'recipe-1',
          p_variant_id: 'variant-1',
        }
      );
    });

    it('should throw error when variant not found', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      await expect(
        service.deleteRecipeVariant('recipe-1', 'non-existent')
      ).rejects.toThrow('Variant not found or already deleted');
    });

    it('should handle database errors on delete', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.deleteRecipeVariant('recipe-1', 'variant-1')
      ).rejects.toThrow();
    });
  });
});
