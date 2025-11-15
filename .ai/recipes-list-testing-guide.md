# Recipes List View - Testing Guide

## Overview

This document provides guidance for testing the Recipes List (Dashboard) view implementation.

## Prerequisites

### Authentication Setup

The `/recipes` page requires authentication. To test the page, you need to:

1. **Set up Supabase authentication** in your local environment
2. **Create a test user account** using Supabase Auth
3. **Obtain a session cookie** by signing in through your authentication flow

### Development Environment

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000 (or another port if 3000 is in use)
```

## Testing Checklist

### 1. Authentication & Access Control

- [ ] Unauthenticated users are redirected to home page (`/`)
- [ ] Authenticated users can access `/recipes`
- [ ] API returns 401 for requests without valid authentication

### 2. Page Load & Initial State

- [ ] Page loads without errors
- [ ] Loading skeletons appear while fetching data
- [ ] URL query parameters are parsed correctly on initial load
- [ ] View mode preference is loaded from localStorage
- [ ] Default filters are applied (page=1, limit=20, sort=created_at, order=desc)

### 3. Search Functionality

- [ ] Search input accepts text input
- [ ] Search is debounced (300ms delay)
- [ ] Search updates URL query parameters
- [ ] Search resets pagination to page 1
- [ ] Empty search returns all recipes
- [ ] Special characters in search are handled properly
- [ ] Search results show appropriate "No results found" message

### 4. Sorting & Ordering

- [ ] Sort dropdown shows all options (Date Created, Date Modified, Title)
- [ ] Changing sort option triggers new API call
- [ ] Sort updates URL query parameters
- [ ] Order toggle switches between ascending/descending
- [ ] Order icon updates correctly (↑ for asc, ↓ for desc)
- [ ] Sorting resets pagination to page 1

### 5. View Mode Toggle

- [ ] Grid view displays recipes in responsive grid (1-4 columns)
- [ ] List view displays recipes in vertical list
- [ ] View mode toggle persists to localStorage
- [ ] View mode persists across page reloads
- [ ] View mode does NOT trigger API call
- [ ] Both views display the same data

### 6. Pagination

- [ ] Pagination controls appear when total_pages > 1
- [ ] Previous button is disabled on first page
- [ ] Next button is disabled on last page
- [ ] Clicking page numbers navigates correctly
- [ ] Page changes update URL query parameters
- [ ] Page changes scroll to top of page smoothly
- [ ] Ellipsis (...) appears for large page ranges
- [ ] First and last page always visible when needed

### 7. Recipe Cards/Items

- [ ] Recipe title displays correctly
- [ ] Created date is formatted properly
- [ ] Cards are clickable and link to `/recipes/:id`
- [ ] Hover effects work (shadow, scale)
- [ ] Focus indicators are visible when navigating with keyboard
- [ ] Cards have proper ARIA labels

### 8. Empty States

- [ ] "No recipes yet" appears when user has no recipes
- [ ] "Create New Recipe" button is shown in empty state
- [ ] "No results found" appears when search returns no results
- [ ] Empty state messaging changes based on active filters

### 9. Error Handling

- [ ] Network errors display error message
- [ ] "Try Again" button allows retry
- [ ] API errors are handled gracefully
- [ ] Authentication errors redirect appropriately
- [ ] Validation errors are displayed clearly

### 10. Accessibility

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] Screen reader announcements work for:
  - Loading state
  - Results count
  - Error messages
  - Empty states
- [ ] ARIA labels are present and descriptive
- [ ] Semantic HTML is used (time, nav, list)
- [ ] Color contrast meets WCAG standards

### 11. Responsive Design

- [ ] Layout adapts to mobile screens (< 640px)
- [ ] Layout adapts to tablet screens (640px - 1024px)
- [ ] Layout adapts to desktop screens (> 1024px)
- [ ] Toolbar stacks vertically on mobile
- [ ] Grid columns adjust appropriately
- [ ] Touch targets are adequate size on mobile

### 12. URL Synchronization

- [ ] URL updates when filters change
- [ ] URL is bookmarkable (loading page with URL params works)
- [ ] Browser back/forward navigation works correctly
- [ ] URL params are properly encoded/decoded
- [ ] Invalid URL params are handled with defaults

### 13. Performance

- [ ] TanStack Query caching works (no unnecessary refetches)
- [ ] Debouncing prevents excessive API calls
- [ ] Loading states prevent layout shift
- [ ] Pagination doesn't reload entire component
- [ ] View mode toggle is instant (no API call)

## Manual Testing Scenarios

### Scenario 1: First-time User

1. Sign in as a new user with no recipes
2. Verify empty state displays with "Create New Recipe" button
3. Create a recipe (requires recipe detail page)
4. Return to recipes list and verify recipe appears

### Scenario 2: Search and Filter

1. Load recipes list with multiple recipes
2. Enter search term
3. Verify debouncing (API only called after typing stops)
4. Verify results update correctly
5. Clear search and verify all recipes return

### Scenario 3: Pagination Flow

1. Create 25+ recipes for testing
2. Navigate through pages using Next/Previous
3. Click specific page numbers
4. Verify URL updates with each navigation
5. Refresh page and verify correct page loads

### Scenario 4: Keyboard Navigation

1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Use Enter/Space to activate buttons
4. Navigate recipe cards with keyboard
5. Verify screen reader announcements

### Scenario 5: Mobile Experience

1. Open page on mobile device or resize browser to mobile width
2. Verify toolbar stacks properly
3. Test touch interactions
4. Verify all controls are accessible
5. Check that view toggle persists

## API Testing

### Test API Endpoint Directly

```bash
# Get recipes (requires valid auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/recipes?page=1&limit=20&sort=created_at&order=desc"

# Search recipes
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/recipes?search=healthy&page=1&limit=20"

# Test validation errors
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/recipes?page=invalid"
```

### Expected Responses

**Success (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Recipe Title",
      "content": "Recipe content...",
      "content_json": null,
      "is_public": false,
      "created_at": "2025-11-03T10:00:00Z",
      "updated_at": "2025-11-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

**Unauthorized (401):**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Validation Error (400):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "page": "must be a positive integer"
    }
  }
}
```

## Known Issues & Limitations

1. **Authentication Required**: You must set up Supabase authentication and create a test user to test the page
2. **Node Version**: The shadcn CLI requires Node 18+, so some components were created manually
3. **Sign-in Page**: The `/sign-in` page referenced in redirects doesn't exist yet - users are redirected to `/` instead

## Next Steps

1. Implement authentication pages (sign-in, sign-up)
2. Create recipe detail page (`/recipes/:id`)
3. Implement recipe creation page (`/recipes/new`)
4. Add integration tests
5. Add unit tests for components
6. Set up E2E testing with Playwright or Cypress
