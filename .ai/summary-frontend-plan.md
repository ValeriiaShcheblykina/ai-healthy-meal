<conversation_summary>

<decisions>
1. The primary navigation will expose four items: “Recipes”, “Create a New Recipe”, “Profile”, and “Activity Logs”.
2. Authentication-related pages (sign-in, sign-up, reset) will bypass the main layout and be reached through middleware-enforced redirects.
3. A responsive top bar with a collapsible hamburger menu will be used for global navigation.
4. Recipe creation and editing will occur on a dedicated screen rather than in a modal.
5. A “Generate AI Variant” primary action will be available on every Recipe Detail page.
6. Search, pagination, and sort controls will appear in a combined toolbar above recipe lists; page controls will stay at the bottom.
7. Tailwind’s default breakpoints (`sm`, `md`, `lg`, `xl`) and a mobile-first grid layout will drive responsiveness.
8. Shadcn/ui primitives plus Tailwind’s extended token palette will underpin accessibility and design consistency (WCAG AA).
9. React Context with TanStack Query will handle global state, caching, optimistic updates, and background revalidation.
10. A central error boundary with toasts and fallback screens will surface API error states coherently.

</decisions>

<matched_recommendations>
1. Isolated auth pages outside the standard `Layout.astro`.
2. Responsive top bar + hamburger for main navigation.
3. Dedicated recipe creation screen with validation for text/JSON content.
4. Sticky “Generate AI Variant” button (or FAB on mobile) opening a stepwise drawer.
5. Search/filter bar mapped to `GET /api/recipes` query parameters.
6. Mobile-first grid (2-col at `md`, 3-col at `lg`) with user-toggle list view.
7. Tailwind semantic tokens + Shadcn/ui components for color-contrast compliance.
8. TanStack Query for caching (2 min stale for recipes, 5 min for logs) and prefetch on hover.
9. Skeleton loaders for lists; small spinners for mutative actions.
10. Soft-delete confirmation modal reflecting API success toast.

</matched_recommendations>

<ui_architecture_planning_summary>
a. Main UI Architecture Requirements  
   • Astro 5 shell with React 19 islands for interactive views.  
   • Global `Layout.astro` wraps all authenticated routes; auth screens are standalone.  
   • State layer: React Context + TanStack Query; localStorage for user preferences (view mode, sort).  
   • Central error boundary & notification system.

b. Key Views, Screens, and User Flows  
   • Recipes List (grid/list toggle, search/filter, pagination).  
   • Recipe Detail (read view) with sticky actions: Edit, Delete, Generate AI Variant.  
   • Create/Edit Recipe screen (tabbed Rich-Text / JSON editor).  
   • AI Variant Generation drawer (options → progress → result).  
   • Variants List (per recipe) and Variant Detail.  
   • Profile Preferences form (diet, allergens, calorie target).  
   • Activity Logs list grouped by day, with filters.  
   • Auth screens: Sign-In, Sign-Up, Reset Password.  
   • Error/empty states for 401/403/404.

c. API Integration & State Management  
   • Supabase Auth handled in middleware; JWT placed in `Authorization` header for all fetches.  
   • Query hooks map 1-to-1 to REST endpoints; TanStack Query caches & prefetches.  
   • Mutations perform optimistic updates; on failure, rollback via query invalidation.  
   • Background revalidation on window focus; stale times tuned per resource.  
   • Soft-delete actions call DELETE endpoints and refresh corresponding lists.

d. Responsiveness, Accessibility, Security  
   • Tailwind mobile-first grid; breakpoints `sm–xl`.  
   • Keyboard-navigable menus, ARIA labels, semantic headings.  
   • Color tokens guarantee WCAG AA contrast.  
   • Protected routes redirect unauth’d users; CSRF mitigated via JWT/HTTPS.  
   • All forms include client + server validation messages.

e. Unresolved Issues / Further Clarification Needed  
   • Default layout preference (grid vs. list) not confirmed.  
   • Final design of the tabbed Rich-Text/JSON editor (tooling and validation UX).  
   • Details of soft-deleted item “Trash / Restore” flow.  
   • Rate-limiting feedback UI for AI generation endpoint.  
   • Choice between Zustand vs. pure React Context for small non-query UI state.

</ui_architecture_planning_summary>

<unresolved_issues>
1. Confirm grid vs. list default and user preference persistence.  
2. Decide on editor implementation for JSON vs. Rich-Text (e.g., Monaco, Markdown).  
3. Define UX for restoring soft-deleted recipes/variants.  
4. Establish visible rate-limit warnings for AI generation errors (429 or cost limits).  
5. Clarify whether additional theming (dark mode) is required in MVP.
</unresolved_issues>

</conversation_summary>
