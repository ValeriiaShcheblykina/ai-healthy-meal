# UI Architecture for HealthyMeal

## 1. UI Structure Overview

The UI architecture for HealthyMeal is designed as a responsive, single-page application (SPA) experience built with Astro for the static shell and React for interactive "islands." This hybrid approach ensures fast page loads while providing a rich, dynamic user experience for authenticated users.

The structure is centered around a main dashboard layout that provides global navigation to all key features once a user is authenticated. Authentication-related views (Sign In, Sign Up) are intentionally kept separate from this main layout to provide a focused, streamlined experience. State management will be handled by TanStack Query for server state (caching API data, handling mutations) and React Context for minimal global UI state.

The design is mobile-first, ensuring a seamless experience across all devices, and prioritizes accessibility and a clear user flow to meet the core product goals of recipe management and AI-driven modification.

## 2. View List

### 2.1 Authentication Views

These views exist outside the main application layout and are accessible only to unauthenticated users.

#### **Sign In**

- **View Path:** `/sign-in`
- **Main Purpose:** To allow existing users to log in to their account.
- **Key Information:** Email and password fields, a "Sign In" button, and links to the "Sign Up" and "Reset Password" views.
- **Key Components:** `Card`, `Input`, `Button`, `Form`.
- **Considerations:**
  - **UX:** Clear error messages for invalid credentials. Show/hide password toggle.
  - **Accessibility:** Proper form labels, keyboard navigation, and focus management.
  - **Security:** All form submissions must use HTTPS.

#### **Sign Up**

- **View Path:** `/sign-up`
- **Main Purpose:** To allow new users to create an account.
- **Key Information:** Email, password, and confirm password fields, a "Sign Up" button, and a link to the "Sign In" view.
- **Key Components:** `Card`, `Input`, `Button`, `Form`.
- **Considerations:**
  - **UX:** Real-time password strength validation and mismatch errors. Clear success message upon registration.
  - **Accessibility:** Full keyboard accessibility for form fields and actions.
  - **Security:** Enforce password complexity rules on the client-side as an initial check.

#### **Reset Password**

- **View Path:** `/reset-password`
- **Main Purpose:** To provide a way for users to reset a forgotten password.
- **Key Information:** An email input field and a button to send a reset link.
- **Key Components:** `Card`, `Input`, `Button`, `Form`.
- **Considerations:**
  - **UX:** Clear confirmation message indicating that a reset email has been sent if the account exists.
  - **Accessibility:** Properly labeled form fields.
  - **Security:** The link sent to the user should be a single-use, time-limited token.

---

### 2.2 Core Application Views

These views are protected by authentication and are wrapped in the main application layout with global navigation.

#### **Recipes List (Dashboard)**

- **View Path:** `/recipes`
- **Main Purpose:** To display a user's collection of recipes and serve as the main entry point after login.
- **Key Information:** A grid or list of the user's recipes, each showing a title and creation date.
- **Key Components:** `Header`, `RecipeCard`, `RecipeListItem`, `SearchBar`, `SortDropdown`, `PaginationControls`, `ViewToggle` (Grid/List), `Button` (for "Create New Recipe").
- **Considerations:**
  - **UX:** Skeleton loaders while recipes are being fetched. A clear empty state with a call-to-action to create the first recipe. The user's view preference (grid/list) should be persisted in local storage.
  - **Accessibility:** `aria-label` attributes for all controls. Ensure recipe cards/items are keyboard-focusable.
  - **API Mapping:** This view is powered by the `GET /api/recipes` endpoint, utilizing its `search`, `sort`, `order`, `page`, and `limit` query parameters.

#### **Recipe Detail**

- **View Path:** `/recipes/:id`
- **Main Purpose:** To display the full content of a selected recipe and its generated variants.
- **Key Information:** The recipe's title and content. A list of all associated variants (showing creation date and model).
- **Key Components:** `Header`, `Button` (Edit, Delete, Generate AI Variant), `VariantList`, `ConfirmationModal` (for delete), `AIGenerationDrawer`.
- **Considerations:**
  - **UX:** The "Generate AI Variant" action should be prominent. Deleting a recipe should trigger a confirmation modal to prevent accidental data loss. A toast notification should confirm success/failure of actions.
  - **Accessibility:** Semantic HTML for recipe content. All actions must be keyboard-accessible.
  - **API Mapping:** The initial data is fetched from `GET /api/recipes/:id`. Deletion uses `DELETE /api/recipes/:id`. Generating a variant triggers a call to `POST /api/recipes/:recipeId/variants/generate`.

#### **Create/Edit Recipe**

- **View Paths:** `/recipes/new`, `/recipes/:id/edit`
- **Main Purpose:** To provide a form for creating a new recipe or updating an existing one.
- **Key Information:** A form containing fields for the recipe's title and content (as rich text or raw JSON).
- **Key Components:** `Header`, `Form`, `Input` (for title), `RichTextEditor`/`JSONEditor`, `Button` (Save, Cancel).
- **Considerations:**
  - **UX:** For the "Edit" view, the form is pre-populated with existing data. Implement draft auto-saving to local storage to prevent data loss. Provide clear validation feedback.
  - **Accessibility:** All form elements must have associated labels. Editor components must be keyboard-navigable.
  - **API Mapping:** Creating a recipe uses `POST /api/recipes`. Updating uses `PUT /api/recipes/:id`.

#### **Recipe Variant Detail**

- **View Path:** `/recipes/:recipeId/variants/:variantId`
- **Main Purpose:** To display the detailed output of a single recipe variant.
- **Key Information:** The full generated `output_text` or `output_json`, along with metadata like the model used, the prompt, and the `preferences_snapshot`.
- **Key Components:** `Header`, `MetadataDisplay`, `ContentRenderer`.
- **Considerations:**
  - **UX:** Clearly differentiate the variant's content from the original recipe. Allow easy navigation back to the parent recipe.
  - **Accessibility:** Use appropriate semantic tags for the displayed content.
  - **API Mapping:** Powered by `GET /api/recipes/:recipeId/variants/:variantId`.

#### **User Profile**

- **View Path:** `/profile`
- **Main Purpose:** To allow users to set and update their dietary preferences, which will be used by the AI for recipe generation.
- **Key Information:** A form with fields for diet type, allergens, disliked ingredients, and calorie targets.
- **Key Components:** `Header`, `Form`, `Select` (for diet), `TagInput` (for allergens/ingredients), `Input` (for calories), `Button` (Save).
- **Considerations:**
  - **UX:** Use intuitive controls like multi-select dropdowns or tag inputs for allergens. Provide informational tooltips explaining how these preferences will be used. A toast notification should confirm that settings have been saved.
  - **Accessibility:** Full form accessibility, including labels and keyboard navigation for all custom controls.
  - **API Mapping:** This view will fetch initial data from a `GET /api/profile` endpoint and save changes via a `PUT /api/profile` endpoint.

## 3. User Journey Map

The primary user journey involves creating a base recipe and then using AI to tailor it to personal preferences.

1.  **Onboarding & First Login:**
    - A new user signs up at `/sign-up`.
    - After confirming their account, they log in at `/sign-in`.
    - They are redirected to the `/recipes` dashboard, which shows an empty state encouraging them to create a recipe or set their preferences.

2.  **Setting Preferences (Success Metric Driver):**
    - The user navigates to `/profile` via the main navigation.
    - They fill out their dietary preferences (e.g., vegan, allergic to nuts) and save the form.

3.  **Creating a Base Recipe:**
    - The user navigates to `/recipes/new`.
    - They enter a title and paste the content of a recipe they found online.
    - They save the recipe and are redirected to the new recipe's detail page at `/recipes/:id`.

4.  **Generating an AI Variant:**
    - On the `/recipes/:id` page, the user clicks the "Generate AI Variant" button.
    - The `AIGenerationDrawer` opens. It confirms that their profile preferences will be used. The user can add a custom instruction, like "make it spicier."
    - The user clicks "Generate." A loading indicator appears.
    - After a few moments, the generation completes, and the new variant appears in the `VariantList` on the `/recipes/:id` page without a full page reload.

5.  **Reviewing and Using the Variant:**
    - The user clicks on the newly created variant to navigate to `/recipes/:recipeId/variants/:variantId`.
    - They can view the full text of the modified, AI-powered recipe.

## 4. Layout and Navigation Structure

- **Main Layout:** A single, persistent layout component (`Layout.astro`) will wrap all authenticated views. This layout contains the global navigation header and a main content area.
- **Global Navigation:** A responsive header at the top of the page will contain:
  - **Logo:** Links back to the `/recipes` dashboard.
  - **Primary Navigation Links:** "Recipes", "Create New Recipe", "Profile".
  - **User Menu:** An icon/avatar on the right that opens a dropdown with a "Sign Out" link.
- **Responsive Behavior:**
  - On desktop screens (`md` breakpoint and up), the navigation links will be displayed horizontally in the header.
  - On mobile screens (`sm`), the navigation links will collapse into a hamburger menu to save space.
- **Authentication Flow:** Middleware will manage routing. Unauthenticated users are restricted to `/sign-in`, `/sign-up`, and `/reset-password`. Attempting to access any other route redirects them to `/sign-in`. Authenticated users are redirected away from auth routes to `/recipes`.

## 5. Key Components

This is a list of key reusable components that will form the UI's building blocks, consistent with the Shadcn/ui library.

- **`Button`:** Used for all actions (e.g., Save, Delete, Generate). Will have variants for primary, secondary, and destructive actions.
- **`Input` / `Form`:** Standard form elements for data entry, used in auth, recipe creation, and profile settings.
- **`Card`:** A container component used to display snippets of information, such as in the `RecipeCard` on the dashboard.
- **`SearchBar`:** A dedicated input component with a search icon for filtering the recipe list.
- **`PaginationControls`:** A component for navigating between pages of data in lists (e.g., `/recipes`).
- **`ConfirmationModal`:** A modal dialog that prompts the user to confirm a critical action, such as deleting a recipe.
- **`AIGenerationDrawer`:** A slide-out panel containing options for generating an AI recipe variant.
- **`Toast`:** A non-intrusive notification element used to provide feedback on asynchronous actions (e.g., "Recipe saved successfully").
- **`SkeletonLoader`:** A component that mimics the layout of content before it has loaded, improving the perceived performance.
