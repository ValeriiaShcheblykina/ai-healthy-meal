# View Implementation Plan: Recipes List (Dashboard)

## 1. Overview

This document outlines the implementation plan for the "Recipes List" view, which serves as the main dashboard for authenticated users. Its primary purpose is to display a user's collection of recipes, providing functionalities for searching, sorting, and pagination. The view will also allow users to toggle between a grid and a list layout and will serve as the entry point for creating new recipes or viewing existing ones in detail.

## 2. View Routing

- **Path:** `/recipes`
- **Access:** This route must be protected and accessible only to authenticated users. Middleware should handle redirection for unauthenticated access.

## 3. Component Structure

The view will be composed of an Astro page that renders a main React component as a client-side island.

```
/src/pages/recipes.astro
└── /src/layouts/Layout.astro
    └── /src/components/recipes/RecipesList.tsx (React Island)
        ├── /src/components/recipes/RecipesToolbar.tsx
        │   ├── /src/components/recipes/SearchBar.tsx
        │   ├── /src/components/recipes/SortDropdown.tsx
        │   └── /src/components/recipes/ViewToggle.tsx
        ├── /src/components/ui/Skeleton.tsx (as SkeletonLoader)
        ├── /src/components/recipes/EmptyState.tsx
        ├── /src/components/recipes/RecipesGrid.tsx
        │   └── /src/components/recipes/RecipeCard.tsx
        ├── /src/components/recipes/RecipesListItems.tsx
        │   └── /src/components/recipes/RecipeListItem.tsx
        └── /src/components/recipes/PaginationControls.tsx
```

## 4. Component Details

### `RecipesList.tsx`

- **Component Description:** The main stateful component that orchestrates the entire view. It manages fetching data, handling user interactions from child components, and rendering the appropriate state (loading, empty, or data).
- **Main Elements:** Renders `RecipesToolbar`, `PaginationControls`, and conditionally renders `SkeletonLoader`, `EmptyState`, or the recipe list (`RecipesGrid`/`RecipesListItems`).
- **Handled Interactions:** Manages state changes for search queries, sorting, pagination, and view mode. Triggers API calls when filters change.
- **Handled Validation:** Parses URL query parameters on initial load, providing default values for any invalid or missing parameters to prevent errors.
- **Types:** `RecipesListState`, `RecipesListViewMode`, `RecipeListResponseDTO`.
- **Props:** None.

### `RecipesToolbar.tsx`

- **Component Description:** A container for all the control elements, allowing the user to filter, sort, and change the layout of the recipe list.
- **Main Elements:** A `div` containing the `SearchBar`, `SortDropdown`, and `ViewToggle` components.
- **Handled Interactions:** Forwards events from its children to the parent `RecipesList` component.
- **Handled Validation:** None.
- **Types:** `RecipesListState`, `RecipesListViewMode`.
- **Props:**
  ```typescript
  interface RecipesToolbarProps {
    filters: RecipesListState;
    viewMode: RecipesListViewMode;
    onFiltersChange: (newFilters: Partial<RecipesListState>) => void;
    onViewModeChange: (newViewMode: RecipesListViewMode) => void;
  }
  ```

### `SearchBar.tsx`

- **Component Description:** An input field for text-based searching. It uses debouncing to avoid excessive API calls.
- **Main Elements:** Shadcn/ui `Input` component with a search icon.
- **Handled Interactions:** Handles `onChange` event on the input, updating a debounced value that is then propagated to the parent.
- **Handled Validation:** None.
- **Types:** `string`.
- **Props:**
  ```typescript
  interface SearchBarProps {
    initialQuery: string;
    onSearch: (query: string) => void;
  }
  ```

### `RecipesGrid.tsx` / `RecipeCard.tsx`

- **Component Description:** `RecipesGrid` renders recipes in a card-based grid layout. `RecipeCard` represents a single recipe, displaying its title and creation date, and links to the recipe's detail page.
- **Main Elements:** `RecipesGrid` is a responsive CSS grid. `RecipeCard` is built using the Shadcn/ui `Card` component, containing an `<a>` tag that wraps the content to make it a clickable link.
- **Handled Interactions:** Navigation to `/recipes/:id` on click.
- **Types:** `RecipeListItemDTO`.
- **Props (`RecipeCardProps`):**
  ```typescript
  interface RecipeCardProps {
    recipe: RecipeListItemDTO;
  }
  ```

### `PaginationControls.tsx`

- **Component Description:** Renders pagination buttons (Previous, Next, page numbers) to navigate through the recipe list.
- **Main Elements:** Uses Shadcn/ui `Pagination` components.
- **Handled Interactions:** `onClick` on page numbers or navigation buttons.
- **Handled Validation:** Disables "Previous" button on the first page and "Next" button on the last page.
- **Types:** `PaginationDTO`.
- **Props:**
  ```typescript
  interface PaginationControlsProps {
    pagination: PaginationDTO;
    onPageChange: (page: number) => void;
  }
  ```

## 5. Types

### `RecipesListViewMode` (ViewModel)

A type to define the possible layout states.

```typescript
export type RecipesListViewMode = 'grid' | 'list';
```

### `RecipesListState` (ViewModel)

A consolidated type to manage all query parameters for the API request. It mirrors `RecipeListQueryParams` but with all fields being required, representing the component's complete state.

```typescript
import type { RecipeListQueryParams } from '../../types';

export type RecipesListState = Required<RecipeListQueryParams>;
```

## 6. State Management

State will be managed within the main `RecipesList.tsx` component using React hooks. A data-fetching library like TanStack Query (`@tanstack/react-query`) is highly recommended to handle server state (fetching, caching, loading/error states).

- **`useRecipesQuery` (Custom Hook/TanStack Query):**
  - **Purpose:** Fetches recipe data based on the current filter state. It will automatically handle caching, re-fetching, and provide `data`, `isLoading`, and `error` states.
  - **Trigger:** It will re-fetch automatically whenever the `filters` state object passed to it changes.

- **`filters` state:**
  - **Type:** `RecipesListState`.
  - **Management:** A single `useState` hook in `RecipesList.tsx`. It will be initialized by reading parameters from the current URL, with sensible defaults. Any interaction with toolbar controls or pagination will update this state object.

- **`viewMode` state:**
  - **Type:** `RecipesListViewMode`.
  - **Management:** A `useState` hook combined with a `useLocalStorage` custom hook to persist the user's choice across sessions. It defaults to 'grid'.

- **URL Synchronization:**
  - A `useEffect` hook will listen for changes in the `filters` state. When filters change, it will use `URLSearchParams` and `window.history.pushState` to update the URL's query string without reloading the page. This ensures the UI state is bookmarkable and shareable.

## 7. API Integration

- **Endpoint:** `GET /api/recipes`
- **Request:**
  - The request will be a `GET` call made from a custom hook (`useRecipesQuery`).
  - **Query Parameters:** The hook will serialize the `filters` state object (`RecipesListState`) into URL query parameters.
  - **Type:** `RecipeListQueryParams`.
- **Response:**
  - The hook will parse the JSON response.
  - **Type:** `RecipeListResponseDTO`.
  - The `data` array will be used to render the recipe list, and the `pagination` object will be passed to `PaginationControls`.

## 8. User Interactions

- **Searching:** User types in the `SearchBar`. The input is debounced (e.g., 300ms) before the `filters` state is updated, triggering a new API call.
- **Sorting:** User selects a new sort option from the `SortDropdown`. The `filters` state is updated immediately, triggering a new API call.
- **Paginating:** User clicks a page number or a navigation button in `PaginationControls`. The `page` number in the `filters` state is updated, triggering a new API call.
- **Changing View:** User clicks an icon in the `ViewToggle`. The `viewMode` state is updated instantly, causing a re-render with the new layout. This does not trigger an API call. The new preference is saved to local storage.
- **Creating Recipe:** User clicks the "Create New Recipe" button, which navigates them to `/recipes/new`.
- **Viewing Recipe:** User clicks on a `RecipeCard` or `RecipeListItem`, which navigates them to `/recipes/:id`.

## 9. Conditions and Validation

- **Initial State:** On load, the `RecipesList` component will parse `window.location.search` to populate the initial `filters` state. It will validate each parameter (e.g., ensuring `page` is a positive number) and fall back to defaults (`{ page: 1, limit: 20, search: '', sort: 'created_at', order: 'desc' }`) for any missing or invalid values.
- **Pagination:** The "Previous" button in `PaginationControls` will be disabled if `pagination.page === 1`. The "Next" button will be disabled if `pagination.page === pagination.total_pages`.
- **Empty State:** If an API response is successful but `data` is an empty array:
  - If a `search` filter is active, a "No results found" message is displayed.
  - If no filters are active, the main `EmptyState` component is displayed, prompting the user to create their first recipe.

## 10. Error Handling

- **API Failure:** If the `fetch` call to `/api/recipes` fails (e.g., network error, 5xx status code), the UI will display a prominent error message (e.g., using a `Toast` or an inline message) with a "Try Again" button to allow the user to re-trigger the API call.
- **Authentication Failure (401/403):** While Astro middleware should prevent this page from being accessed when logged out, if a token expires during a session, the API call will fail. This failure should be handled globally by redirecting the user to the `/sign-in` page.

## 11. Implementation Steps

1.  **Create File Structure:** Create all the component files listed in the "Component Structure" section within `/src/components/recipes/`. Create the Astro page at `/src/pages/recipes.astro`.
2.  **Develop Astro Page (`recipes.astro`):** Set up the page to use the main `Layout.astro` and render the `<RecipesList client:load />` component.
3.  **Implement Static Components:** Build the stateless presentational components first: `RecipeCard`, `RecipeListItem`, `RecipesGrid`, `RecipesListItems`, `EmptyState`, and the skeleton loaders.
4.  **Implement Control Components:** Build the toolbar components: `SearchBar` (with debouncing logic), `SortDropdown`, and `ViewToggle`. Ensure they correctly call the `on*` prop functions when interacted with.
5.  **Build `PaginationControls`:** Implement the pagination component, ensuring it correctly renders page numbers and disables buttons based on the `pagination` prop.
6.  **Implement `RecipesList` Component:**
    - Set up all state variables (`filters`, `viewMode`).
    - Implement the logic to initialize state from the URL and local storage.
    - Set up the data fetching using TanStack Query or a custom `useRecipesQuery` hook.
    - Implement the `useEffect` hook for synchronizing the `filters` state back to the URL.
7.  **Assemble the View:** Combine all the components within `RecipesList.tsx`. Add the conditional rendering logic to display the correct state: loading, empty/no-results, or the data list.
8.  **Styling and Final Touches:** Apply Tailwind CSS classes to all components for styling, ensuring the layout is responsive and matches the design. Add ARIA attributes for accessibility.
9.  **Testing:** Manually test all user interactions: searching, sorting, paginating, changing views, and navigating to other pages. Test all edge cases: empty state, no search results, and API error handling.
