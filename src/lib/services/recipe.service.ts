import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../db/database.types.ts';
import { createInternalError } from '../errors/api-errors.ts';
import type {
  RecipeListQueryParams,
  RecipeListResponseDTO,
  RecipeListItemDTO,
  RecipeEntity,
} from '../../types.ts';

/**
 * Recipe service for business logic related to recipes
 */
export class RecipeService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  /**
   * Lists recipes for the authenticated user with pagination, search, and sorting
   *
   * @param params - Query parameters for pagination, search, and sorting
   * @returns Recipe list response with pagination metadata
   * @throws ApiError if database query fails
   */
  async listRecipes(
    params: Required<RecipeListQueryParams>,
  ): Promise<RecipeListResponseDTO> {
    const { page, limit, search, sort, order } = params;
    const offset = (page - 1) * limit;

    // Build base query
    let query = this.supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .is('deleted_at', null) // Exclude soft-deleted recipes
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply full-text search if provided
    if (search && search.trim().length > 0) {
      // Use PostgreSQL full-text search with content_tsv
      // Since Supabase query builder doesn't directly support tsvector @@ tsquery,
      // we'll use ILIKE for basic search functionality
      // TODO: Consider implementing a database function or using .rpc() for proper
      // full-text search with content_tsv @@ plainto_tsquery('simple', search)
      // For MVP, ILIKE provides reasonable search functionality
      const searchTerm = search.trim();
      query = query.or(
        `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`,
      );
    }

    // Execute query
    const { data, error, count } = await query;

    // Handle database errors
    if (error) {
      // Log error for debugging (in production, use proper logging service)
      console.error('Database error in RecipeService.listRecipes:', error);
      throw createInternalError('Failed to fetch recipes');
    }

    // Transform database entities to DTOs (exclude internal fields)
    const recipes: RecipeListItemDTO[] = (data || []).map((recipe: RecipeEntity) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content_tsv, deleted_at, user_id, ...recipeDTO } = recipe;
      return recipeDTO;
    });

    // Calculate pagination metadata
    const total = count ?? 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    };
  }

  /** Get single recipe by id (respecting RLS and soft delete) */
  async getRecipe(id: string): Promise<RecipeEntity | null> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      // 116: no rows found
      console.error('Error in RecipeService.getRecipe', error);
      throw createInternalError('Failed to fetch recipe');
    }

    return data ?? null;
  }

  /** Create new recipe */
  async createRecipe(
    userId: string,
    payload: Omit<RecipeEntity, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'content_tsv' | 'user_id'>,
  ): Promise<RecipeEntity> {
    const insert = { ...payload, user_id: userId };
    const { data, error } = await this.supabase.from('recipes').insert(insert).select('*').single();
    if (error) {
      console.error('Error in RecipeService.createRecipe', error);
      throw createInternalError('Failed to create recipe');
    }
    return data as RecipeEntity;
  }

  /** Update recipe (must be owned by user) */
  async updateRecipe(
    id: string,
    payload: Partial<RecipeEntity>,
  ): Promise<RecipeEntity> {
    const { data, error } = await this.supabase
      .from('recipes')
      .update(payload)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();
    if (error) {
      console.error('Error in RecipeService.updateRecipe', error);
      throw createInternalError('Failed to update recipe');
    }
    return data as RecipeEntity;
  }

  /** Soft delete recipe */
  async deleteRecipe(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('recipes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Error in RecipeService.deleteRecipe', error);
      throw createInternalError('Failed to delete recipe');
    }
  }
}

