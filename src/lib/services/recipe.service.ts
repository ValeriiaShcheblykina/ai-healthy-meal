/**
 * @module recipe.service
 * @description Service layer for recipe-related business logic and database operations.
 * Provides a clean abstraction over Supabase database queries for recipe management,
 * including CRUD operations, pagination, search, and sorting capabilities.
 *
 * This service implements the following features:
 * - Listing recipes with pagination, search, and sorting
 * - Retrieving individual recipes by ID
 * - Creating new recipes
 * - Updating existing recipes
 * - Soft-deleting recipes (deleted_at field)
 * - Row Level Security (RLS) enforcement through Supabase
 *
 * @requires @supabase/supabase-js - Supabase client for database operations
 * @requires ../../db/database.types - Generated TypeScript types for database schema
 * @requires ../errors/api-errors - Error handling utilities
 * @requires ../../types - Shared DTOs and entity types
 *
 * @example
 * // Initialize service in API route
 * import { RecipeService } from '@/lib/services/recipe.service';
 *
 * export async function GET(context: APIContext) {
 *   const service = new RecipeService(context.locals.supabase);
 *   const recipes = await service.listRecipes({ page: 1, limit: 10, sort: 'created_at', order: 'desc' });
 *   return new Response(JSON.stringify(recipes));
 * }
 */

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
 * Service class for recipe-related business logic and database operations.
 *
 * This service provides a clean abstraction layer over Supabase database queries,
 * handling all recipe CRUD operations while respecting Row Level Security (RLS) policies.
 * All operations automatically filter soft-deleted records (deleted_at IS NULL).
 *
 * @class RecipeService
 *
 * @property {SupabaseClient<Database>} supabase - Typed Supabase client instance with RLS context
 *
 * @example
 * // Instantiate service with authenticated Supabase client
 * const supabase = context.locals.supabase; // Contains user session from middleware
 * const recipeService = new RecipeService(supabase);
 *
 * @example
 * // Use in API route
 * export async function GET(context: APIContext) {
 *   const service = new RecipeService(context.locals.supabase);
 *   const result = await service.listRecipes({
 *     page: 1,
 *     limit: 20,
 *     search: 'pasta',
 *     sort: 'created_at',
 *     order: 'desc'
 *   });
 *   return new Response(JSON.stringify(result));
 * }
 *
 * @remarks
 * - All database operations respect Supabase Row Level Security (RLS) policies
 * - Soft-deleted recipes (deleted_at IS NOT NULL) are automatically excluded from all queries
 * - Database errors are caught and transformed into ApiError instances with 500 status
 * - This service does NOT perform authentication - ensure user context is set in Supabase client
 */
export class RecipeService {
  /**
   * Creates a new RecipeService instance.
   *
   * @constructor
   * @param {SupabaseClient<Database>} supabase - Authenticated Supabase client with user context.
   *   The client should be obtained from context.locals.supabase (set by middleware).
   */
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Lists recipes for the authenticated user with pagination, search, and sorting.
   *
   * This method performs a paginated query on the recipes table, applying optional
   * search filtering and custom sorting. Results are automatically filtered by RLS
   * policies and soft-delete status. Internal database fields are excluded from
   * the response DTOs.
   *
   * @async
   * @method listRecipes
   * @param {Required<RecipeListQueryParams>} params - Query parameters (all required)
   * @param {number} params.page - Page number (1-indexed). Must be >= 1.
   * @param {number} params.limit - Number of items per page. Typically 10-100.
   * @param {string} [params.search] - Optional search term. Searches in title and content fields using ILIKE (case-insensitive).
   * @param {string} params.sort - Column name to sort by (e.g., 'created_at', 'updated_at', 'title')
   * @param {'asc' | 'desc'} params.order - Sort direction: 'asc' (ascending) or 'desc' (descending)
   *
   * @returns {Promise<RecipeListResponseDTO>} Recipe list response with pagination metadata
   * @returns {RecipeListItemDTO[]} return.data - Array of recipe DTOs (internal fields excluded)
   * @returns {Object} return.pagination - Pagination metadata
   * @returns {number} return.pagination.page - Current page number
   * @returns {number} return.pagination.limit - Items per page
   * @returns {number} return.pagination.total - Total number of matching recipes
   * @returns {number} return.pagination.total_pages - Total number of pages
   *
   * @throws {ApiError} Throws 500 INTERNAL_ERROR if database query fails
   *
   * @example
   * // Basic pagination without search
   * const result = await recipeService.listRecipes({
   *   page: 1,
   *   limit: 20,
   *   sort: 'created_at',
   *   order: 'desc',
   *   search: ''
   * });
   * console.log(result.data); // Array of up to 20 recipes
   * console.log(result.pagination.total); // Total count of all recipes
   *
   * @example
   * // With search filter
   * const result = await recipeService.listRecipes({
   *   page: 1,
   *   limit: 10,
   *   search: 'pasta carbonara',
   *   sort: 'created_at',
   *   order: 'desc'
   * });
   * // Returns recipes where title or content contains 'pasta carbonara'
   *
   * @example
   * // Sort by title alphabetically
   * const result = await recipeService.listRecipes({
   *   page: 1,
   *   limit: 50,
   *   search: '',
   *   sort: 'title',
   *   order: 'asc'
   * });
   *
   * @remarks
   * - Search uses PostgreSQL ILIKE for case-insensitive matching on title and content
   * - TODO: Consider implementing full-text search with content_tsv @@ plainto_tsquery for better performance
   * - Automatically excludes soft-deleted recipes (deleted_at IS NULL)
   * - RLS policies ensure users only see their own recipes
   * - Empty search strings are ignored (no filtering applied)
   * - Internal fields (content_tsv, deleted_at, user_id) are excluded from response
   *
   * @see {@link RecipeListQueryParams} for query parameter details
   * @see {@link RecipeListResponseDTO} for response structure
   */
  async listRecipes(
    params: Required<RecipeListQueryParams>
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
        `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
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
    const recipes: RecipeListItemDTO[] = (data || []).map(
      (recipe: RecipeEntity) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content_tsv, deleted_at, user_id, ...recipeDTO } = recipe;
        return recipeDTO;
      }
    );

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

  /**
   * Retrieves a single recipe by its unique identifier.
   *
   * This method fetches a complete recipe entity by ID, respecting Row Level Security
   * policies and soft-delete status. Returns null if the recipe doesn't exist, is soft-deleted,
   * or the user doesn't have permission to access it (due to RLS).
   *
   * @async
   * @method getRecipe
   * @param {string} id - UUID of the recipe to retrieve
   *
   * @returns {Promise<RecipeEntity | null>} Complete recipe entity including all fields, or null if not found/inaccessible
   *
   * @throws {ApiError} Throws 500 INTERNAL_ERROR if database query fails (excluding "not found" errors)
   *
   * @example
   * // Fetch existing recipe
   * const recipe = await recipeService.getRecipe('123e4567-e89b-12d3-a456-426614174000');
   * if (recipe) {
   *   console.log(recipe.title, recipe.content);
   * } else {
   *   console.log('Recipe not found or access denied');
   * }
   *
   * @example
   * // Use in API route to check ownership before update
   * export async function PUT(context: APIContext) {
   *   const { id } = context.params;
   *   const service = new RecipeService(context.locals.supabase);
   *   const recipe = await service.getRecipe(id);
   *
   *   if (!recipe) {
   *     return createApiErrorResponse(createNotFoundError('Recipe not found'));
   *   }
   *
   *   // Proceed with update...
   * }
   *
   * @remarks
   * - Returns null instead of throwing for "not found" scenarios
   * - Automatically excludes soft-deleted recipes (deleted_at IS NOT NULL)
   * - RLS policies ensure users can only access their own recipes
   * - PostgreSQL error code PGRST116 (no rows) is handled gracefully
   * - Use this method when you need all recipe fields (including internal fields like user_id)
   */
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

  /**
   * Creates a new recipe for the authenticated user.
   *
   * This method inserts a new recipe into the database, automatically setting
   * the user_id, timestamps, and other auto-generated fields. The database
   * handles id generation (UUID), timestamp creation, and full-text search vector
   * (content_tsv) generation via triggers.
   *
   * @async
   * @method createRecipe
   * @param {string} userId - UUID of the authenticated user who owns this recipe
   * @param {Object} payload - Recipe data (excluding auto-generated fields)
   * @param {string} payload.title - Recipe title (required)
   * @param {string} payload.content - Recipe content/instructions (required)
   * @param {string} [payload.image_url] - Optional URL to recipe image
   * @param {number} [payload.prep_time] - Optional preparation time in minutes
   * @param {number} [payload.cook_time] - Optional cooking time in minutes
   * @param {number} [payload.servings] - Optional number of servings
   *
   * @returns {Promise<RecipeEntity>} The newly created recipe with all database-generated fields
   *
   * @throws {ApiError} Throws 500 INTERNAL_ERROR if database insertion fails
   *
   * @example
   * // Create basic recipe
   * const newRecipe = await recipeService.createRecipe(userId, {
   *   title: 'Spaghetti Carbonara',
   *   content: '1. Cook pasta...',
   * });
   * console.log(newRecipe.id); // Auto-generated UUID
   * console.log(newRecipe.created_at); // Auto-generated timestamp
   *
   * @example
   * // Create recipe with all fields
   * const newRecipe = await recipeService.createRecipe(userId, {
   *   title: 'Chocolate Cake',
   *   content: 'Mix ingredients and bake at 350°F...',
   *   image_url: 'https://example.com/cake.jpg',
   *   prep_time: 20,
   *   cook_time: 45,
   *   servings: 8
   * });
   *
   * @example
   * // Use in API POST route
   * export async function POST(context: APIContext) {
   *   const userId = await getAuthenticatedUserId(context);
   *   const body = await context.request.json();
   *   const service = new RecipeService(context.locals.supabase);
   *
   *   const recipe = await service.createRecipe(userId, {
   *     title: body.title,
   *     content: body.content,
   *     prep_time: body.prep_time
   *   });
   *
   *   return new Response(JSON.stringify(recipe), { status: 201 });
   * }
   *
   * @remarks
   * - Database automatically generates: id, created_at, updated_at, content_tsv
   * - user_id is set from the userId parameter
   * - deleted_at is initially null (not soft-deleted)
   * - RLS policies enforce that users can only create recipes for themselves
   * - Validation should be performed before calling this method
   * - Full-text search index is automatically updated via database trigger
   */
  async createRecipe(
    userId: string,
    payload: Omit<
      RecipeEntity,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'deleted_at'
      | 'content_tsv'
      | 'user_id'
    >
  ): Promise<RecipeEntity> {
    const insert = { ...payload, user_id: userId };
    const { data, error } = await this.supabase
      .from('recipes')
      .insert(insert)
      .select('*')
      .single();
    if (error) {
      console.error('Error in RecipeService.createRecipe', error);
      throw createInternalError('Failed to create recipe');
    }
    return data as RecipeEntity;
  }

  /**
   * Updates an existing recipe owned by the authenticated user.
   *
   * This method performs a partial update on a recipe, allowing modification of
   * any subset of fields. The database automatically updates the updated_at timestamp
   * and content_tsv (full-text search vector) via triggers. RLS policies ensure
   * users can only update their own recipes.
   *
   * @async
   * @method updateRecipe
   * @param {string} id - UUID of the recipe to update
   * @param {Partial<RecipeEntity>} payload - Partial recipe data with fields to update
   * @param {string} [payload.title] - Updated recipe title
   * @param {string} [payload.content] - Updated recipe content/instructions
   * @param {string} [payload.image_url] - Updated image URL
   * @param {number} [payload.prep_time] - Updated preparation time in minutes
   * @param {number} [payload.cook_time] - Updated cooking time in minutes
   * @param {number} [payload.servings] - Updated number of servings
   *
   * @returns {Promise<RecipeEntity>} The updated recipe with all current field values
   *
   * @throws {ApiError} Throws 500 INTERNAL_ERROR if:
   *   - Database update fails
   *   - Recipe doesn't exist
   *   - Recipe is soft-deleted
   *   - User doesn't own the recipe (RLS policy violation)
   *
   * @example
   * // Update single field
   * const updated = await recipeService.updateRecipe(recipeId, {
   *   title: 'Updated Recipe Title'
   * });
   *
   * @example
   * // Update multiple fields
   * const updated = await recipeService.updateRecipe(recipeId, {
   *   title: 'Improved Carbonara',
   *   content: 'New improved instructions...',
   *   prep_time: 15,
   *   cook_time: 20
   * });
   *
   * @example
   * // Use in API PUT/PATCH route
   * export async function PATCH(context: APIContext) {
   *   const { id } = context.params;
   *   const userId = await getAuthenticatedUserId(context);
   *   const body = await context.request.json();
   *   const service = new RecipeService(context.locals.supabase);
   *
   *   // Check ownership first (optional, RLS will enforce anyway)
   *   const existing = await service.getRecipe(id);
   *   if (!existing) {
   *     return createApiErrorResponse(createNotFoundError());
   *   }
   *
   *   const updated = await service.updateRecipe(id, {
   *     title: body.title,
   *     content: body.content
   *   });
   *
   *   return new Response(JSON.stringify(updated));
   * }
   *
   * @remarks
   * - Only provided fields are updated; omitted fields remain unchanged
   * - updated_at timestamp is automatically set by database
   * - content_tsv is automatically regenerated if title or content changes (database trigger)
   * - Cannot update: id, user_id, created_at, deleted_at (use deleteRecipe for soft delete)
   * - RLS policies prevent updating recipes owned by other users
   * - Soft-deleted recipes cannot be updated (deleted_at IS NULL filter applied)
   * - If recipe not found or unauthorized, error is thrown (not null return)
   *
   * @see {@link getRecipe} to check existence/ownership before updating
   * @see {@link deleteRecipe} for soft-deleting recipes
   */
  async updateRecipe(
    id: string,
    payload: Partial<RecipeEntity>
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

  /**
   * Soft-deletes a recipe by setting its deleted_at timestamp.
   *
   * This method performs a soft delete rather than permanently removing the recipe
   * from the database. The recipe is marked as deleted but remains in the database
   * for potential recovery or audit purposes. Soft-deleted recipes are automatically
   * excluded from all queries (listRecipes, getRecipe, updateRecipe).
   *
   * @async
   * @method deleteRecipe
   * @param {string} id - UUID of the recipe to soft-delete
   *
   * @returns {Promise<void>} Resolves when deletion is complete (no return value)
   *
   * @throws {ApiError} Throws 500 INTERNAL_ERROR if:
   *   - Database update fails
   *   - Recipe doesn't exist
   *   - User doesn't own the recipe (RLS policy violation)
   *
   * @example
   * // Delete recipe
   * await recipeService.deleteRecipe(recipeId);
   * console.log('Recipe soft-deleted successfully');
   *
   * @example
   * // Use in API DELETE route
   * export async function DELETE(context: APIContext) {
   *   const { id } = context.params;
   *   const userId = await getAuthenticatedUserId(context);
   *   const service = new RecipeService(context.locals.supabase);
   *
   *   // Optional: verify ownership first
   *   const recipe = await service.getRecipe(id);
   *   if (!recipe) {
   *     return createApiErrorResponse(createNotFoundError());
   *   }
   *
   *   await service.deleteRecipe(id);
   *   return new Response(null, { status: 204 }); // No Content
   * }
   *
   * @example
   * // Error handling
   * try {
   *   await recipeService.deleteRecipe(recipeId);
   * } catch (error) {
   *   if (error instanceof ApiError) {
   *     console.error('Failed to delete recipe:', error.message);
   *   }
   * }
   *
   * @remarks
   * - This is a SOFT delete - data is not permanently removed from database
   * - Sets deleted_at to current ISO timestamp
   * - Soft-deleted recipes are excluded from listRecipes, getRecipe, and updateRecipe
   * - RLS policies ensure users can only delete their own recipes
   * - Already-deleted recipes can be "deleted" again (updates timestamp)
   * - For permanent deletion, database administrators would need direct access
   * - No return value - success is indicated by not throwing an error
   *
   * @see {@link getRecipe} to verify existence before deletion
   * @see {@link listRecipes} which automatically excludes soft-deleted recipes
   */
  async deleteRecipe(id: string): Promise<void> {
    // Use RPC function with explicit auth.uid() check inside for security
    // Type cast needed because function was created after types were generated
    // TODO: Regenerate database types with: npx supabase gen types typescript --local
    const { error } = await (this.supabase as any).rpc('soft_delete_recipe', {
      recipe_id: id,
    });

    if (error) {
      console.error('Error in RecipeService.deleteRecipe', error);
      throw createInternalError('Failed to delete recipe');
    }
  }
}
