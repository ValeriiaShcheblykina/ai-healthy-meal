import type { CreateRecipeCommand, UpdateRecipeCommand } from "../../types.ts";
import { createValidationError } from "../errors/api-errors.ts";

export function validateCreateRecipePayload(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw createValidationError('Invalid request body');
  }
  const payload = data as Partial<CreateRecipeCommand>;
  const errors: Record<string, string> = {};

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim() === '') {
    errors.title = 'title is required and must be a non-empty string';
  }

  const hasContent = payload.content && payload.content.trim() !== '';
  const hasJson = payload.content_json !== undefined && payload.content_json !== null;
  if (!hasContent && !hasJson) {
    errors.content = 'Either content or content_json must be provided';
  }

  if (Object.keys(errors).length) {
    throw createValidationError('Invalid request body', errors);
  }

  // Defaults
  return {
    title: payload.title!.trim(),
    content: payload.content ?? null,
    content_json: payload.content_json ?? null,
    is_public: payload.is_public ?? false,
  } satisfies CreateRecipeCommand;
}
