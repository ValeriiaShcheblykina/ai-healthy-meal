# Authentication System Architecture Specification

## Document Information

**Version:** 1.0  
**Date:** November 4, 2025  
**Project:** HealthyMeal MVP  
**Purpose:** Detailed technical specification for user authentication and account management system

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Overview

The authentication UI will be implemented using a hybrid approach:

- **Astro pages** (`.astro`) for server-side rendered authentication pages with forms
- **React components** (`.tsx`) for interactive elements requiring client-side logic (validation feedback, loading states, password visibility toggles)
- **Astro layouts** for consistent structure across authenticated and non-authenticated states

### 1.2 Pages and Routes

#### 1.2.1 Public Authentication Pages

**Page: `/sign-up` (Sign Up)**

- **File:** `src/pages/sign-up.astro`
- **Purpose:** User registration page
- **Layout:** Uses `Layout.astro` (public variant)
- **Components:**
  - `SignUpForm` (React component) - handles form interactivity
- **Server-side Logic:**
  - Check if user is already authenticated → redirect to `/recipes`
  - No authentication guard required
- **Navigation:**
  - Success → redirect to email confirmation page or directly to `/recipes` (depending on email verification settings)
  - Cancel/Back → redirect to `/` (landing page)
  - Link to `/sign-in` for existing users

**Page: `/sign-in` (Sign In)**

- **File:** `src/pages/sign-in.astro`
- **Purpose:** User login page
- **Layout:** Uses `Layout.astro` (public variant)
- **Components:**
  - `SignInForm` (React component) - handles form interactivity
- **Server-side Logic:**
  - Check if user is already authenticated → redirect to `/recipes`
  - No authentication guard required
- **Navigation:**
  - Success → redirect to `/recipes` or redirect to originally requested page (if stored)
  - Link to `/sign-up` for new users
  - Link to `/forgot-password` for password recovery

**Page: `/forgot-password` (Password Recovery Request)**

- **File:** `src/pages/forgot-password.astro`
- **Purpose:** Initiate password reset flow
- **Layout:** Uses `Layout.astro` (public variant)
- **Components:**
  - `ForgotPasswordForm` (React component)
- **Server-side Logic:**
  - Check if user is already authenticated → redirect to `/profile` (user can change password from settings)
  - No authentication guard required
- **Navigation:**
  - Success → redirect to confirmation page showing "Check your email"
  - Link back to `/sign-in`

**Page: `/reset-password` (Password Reset Completion)**

- **File:** `src/pages/reset-password.astro`
- **Purpose:** Complete password reset with token from email
- **Layout:** Uses `Layout.astro` (public variant)
- **Components:**
  - `ResetPasswordForm` (React component)
- **Server-side Logic:**
  - Validate reset token from URL query parameter
  - If token invalid/expired → show error message
- **Navigation:**
  - Success → redirect to `/sign-in` with success message
  - Token invalid → show error and link to `/forgot-password`

**Page: `/email-confirmation` (Email Verification Status)**

- **File:** `src/pages/email-confirmation.astro`
- **Purpose:** Display email verification status and instructions
- **Layout:** Uses `Layout.astro` (public variant)
- **Server-side Logic:**
  - Check if arriving from sign-up flow or email verification link
  - Display appropriate messaging
- **Navigation:**
  - Button to resend verification email
  - Link to `/sign-in` once verified

#### 1.2.2 Protected Pages (Require Authentication)

**Page: `/profile` (User Profile & Preferences)**

- **File:** `src/pages/profile.astro`
- **Purpose:** View and edit user profile, including dietary preferences
- **Layout:** Uses `Layout.astro` (authenticated variant with header/navigation)
- **Components:**
  - `ProfileForm` (React component) - user profile editor
  - `PreferencesForm` (React component) - dietary preferences editor
  - `AccountSettings` (React component) - email, password change options
- **Server-side Logic:**
  - Authentication guard: `getAuthenticatedUser(Astro)` → redirect to `/sign-in` if not authenticated
  - Fetch user profile data on server
  - Pass initial data to React components
- **Navigation:**
  - Success → stay on page with success toast/message
  - Link back to `/recipes`

**Existing Page: `/recipes` (Recipe List)**

- **File:** `src/pages/recipes.astro` (already exists, needs header extension)
- **Current State:** Already has authentication guard
- **Changes Required:**
  - Extend layout to include header navigation with user menu
  - No changes to authentication logic (already implemented)

**Future Pages:**

- `/recipes/[id]` - Recipe detail page (will require same authentication guard)
- `/recipes/new` - Create new recipe (will require same authentication guard)

#### 1.2.3 Public Landing Page

**Page: `/` (Landing Page)**

- **File:** `src/pages/index.astro` (already exists, needs updates)
- **Current State:** Shows recipe list without authentication
- **Changes Required:**
  - Check authentication state
  - If authenticated → show user's recipes (keep current RecipesList component)
  - If not authenticated → show marketing content with CTAs to sign up/sign in
  - Add header navigation (see section 1.3)

### 1.3 Layout Components

#### 1.3.1 Base Layout

**Component: `Layout.astro`**

- **File:** `src/layouts/Layout.astro` (already exists, needs extension)
- **Current State:** Basic HTML structure with title prop
- **Changes Required:**
  - Accept new props:
    - `showHeader?: boolean` (default: true)
    - `requireAuth?: boolean` (default: false)
  - Conditionally render header navigation based on `showHeader` prop
  - Pass authentication state to header component

**Usage Example:**

```astro
<Layout title="Sign In" showHeader={false}>
  <!-- Auth pages without header -->
</Layout>

<Layout title="My Recipes" showHeader={true}>
  <!-- Authenticated pages with header -->
</Layout>
```

#### 1.3.2 Header Navigation Component

**Component: `Header.astro` (New)**

- **File:** `src/components/Header.astro`
- **Purpose:** Top navigation bar with authentication-aware UI
- **Props:**
  - `user?: User | null` - authenticated user object from Supabase
- **Behavior:**
  - If `user` is null → show "Sign In" and "Sign Up" buttons
  - If `user` exists → show user menu with:
    - User display name or email
    - "My Recipes" link
    - "Profile" link
    - "Sign Out" button
- **Components:**
  - `UserMenu` (React component) - dropdown menu for authenticated users
  - `SignOutButton` (React component) - handles sign out action

**Component: `UserMenu.tsx` (New)**

- **File:** `src/components/auth/UserMenu.tsx`
- **Type:** React component (client-side interactive)
- **Purpose:** Dropdown menu for authenticated user actions
- **State:**
  - `isOpen: boolean` - dropdown visibility
- **Props:**
  - `user: { id: string; email: string; display_name?: string }`
- **Features:**
  - Accessible dropdown (keyboard navigation, ARIA attributes)
  - Menu items: My Recipes, Profile, Sign Out
  - Click outside to close

**Component: `SignOutButton.tsx` (New)**

- **File:** `src/components/auth/SignOutButton.tsx`
- **Type:** React component (client-side interactive)
- **Purpose:** Handle user sign out
- **Behavior:**
  - On click → call Supabase auth.signOut()
  - Show loading state during sign out
  - On success → redirect to `/sign-in`
  - On error → display error message

### 1.4 Form Components

#### 1.4.1 Sign Up Form

**Component: `SignUpForm.tsx` (New)**

- **File:** `src/components/auth/SignUpForm.tsx`
- **Type:** React component (client-side interactive)
- **Purpose:** User registration form with validation
- **Form Fields:**
  1. `email` (text input, required)
     - Validation: Valid email format
     - Error messages:
       - Empty: "Email is required"
       - Invalid format: "Please enter a valid email address"
       - Already exists: "An account with this email already exists"
  2. `password` (password input, required)
     - Validation: Minimum 8 characters, at least one number, one uppercase, one lowercase
     - Error messages:
       - Empty: "Password is required"
       - Too short: "Password must be at least 8 characters"
       - Weak: "Password must contain at least one number, one uppercase and one lowercase letter"
  3. `confirmPassword` (password input, required)
     - Validation: Must match password field
     - Error messages:
       - Empty: "Please confirm your password"
       - Mismatch: "Passwords do not match"
  4. `displayName` (text input, optional)
     - Validation: Max 100 characters
     - Error messages:
       - Too long: "Display name must be less than 100 characters"
- **UI Elements:**
  - Password visibility toggle (eye icon)
  - Submit button with loading state
  - Link to sign in page for existing users
  - Terms of service checkbox (required)
- **State:**
  - Form field values
  - Validation errors (per field)
  - Global error message
  - Loading state
  - Success state
- **Client-side Actions:**
  - Real-time validation on blur
  - Form submission validation
  - Call to `/api/auth/sign-up` endpoint
  - Handle success (redirect) and error states
- **Accessibility:**
  - Proper label associations
  - ARIA error announcements
  - Keyboard navigation
  - Focus management

#### 1.4.2 Sign In Form

**Component: `SignInForm.tsx` (New)**

- **File:** `src/components/auth/SignInForm.tsx`
- **Type:** React component (client-side interactive)
- **Purpose:** User login form with validation
- **Form Fields:**
  1. `email` (text input, required)
     - Validation: Valid email format
     - Error messages:
       - Empty: "Email is required"
       - Invalid format: "Please enter a valid email address"
  2. `password` (password input, required)
     - Validation: Not empty
     - Error messages:
       - Empty: "Password is required"
  3. `rememberMe` (checkbox, optional)
     - Purpose: Extended session duration
- **UI Elements:**
  - Password visibility toggle
  - Submit button with loading state
  - "Forgot password?" link
  - "Don't have an account? Sign up" link
- **State:**
  - Form field values
  - Validation errors (per field)
  - Global error message (invalid credentials)
  - Loading state
- **Client-side Actions:**
  - Form validation on submit
  - Call to `/api/auth/sign-in` endpoint
  - Handle success (redirect) and error states
  - Error messages:
    - Invalid credentials: "Invalid email or password"
    - Account not confirmed: "Please verify your email address before signing in"
    - Too many attempts: "Too many failed login attempts. Please try again later"
- **Accessibility:**
  - Proper label associations
  - ARIA error announcements
  - Keyboard navigation

#### 1.4.3 Forgot Password Form

**Component: `ForgotPasswordForm.tsx` (New)**

- **File:** `src/components/auth/ForgotPasswordForm.tsx`
- **Type:** React component
- **Purpose:** Request password reset email
- **Form Fields:**
  1. `email` (text input, required)
     - Validation: Valid email format
     - Error messages:
       - Empty: "Email is required"
       - Invalid format: "Please enter a valid email address"
- **UI Elements:**
  - Submit button with loading state
  - Link back to sign in page
  - Success message display area
- **State:**
  - Email value
  - Validation error
  - Loading state
  - Success state (show confirmation message)
- **Client-side Actions:**
  - Form validation
  - Call to `/api/auth/forgot-password` endpoint
  - Always show success message (security: don't reveal if email exists)
  - Display: "If an account exists with this email, you will receive password reset instructions"

#### 1.4.4 Reset Password Form

**Component: `ResetPasswordForm.tsx` (New)**

- **File:** `src/components/auth/ResetPasswordForm.tsx`
- **Type:** React component
- **Purpose:** Set new password with reset token
- **Form Fields:**
  1. `password` (password input, required)
     - Same validation as sign up password
  2. `confirmPassword` (password input, required)
     - Must match password
- **UI Elements:**
  - Password visibility toggle
  - Submit button with loading state
  - Password strength indicator
- **State:**
  - Form field values
  - Validation errors
  - Loading state
  - Success state
  - Token validation state
- **Client-side Actions:**
  - Validate token on component mount (call endpoint to check)
  - Form validation
  - Call to `/api/auth/reset-password` endpoint
  - Handle success (redirect to sign in with message)
  - Error messages:
    - Invalid token: "This password reset link is invalid or has expired"
    - Network error: "Unable to reset password. Please try again"

#### 1.4.5 Profile Form

**Component: `ProfileForm.tsx` (New)**

- **File:** `src/components/profile/ProfileForm.tsx`
- **Type:** React component
- **Purpose:** Edit user profile information
- **Form Fields:**
  1. `displayName` (text input, optional)
  2. `email` (text input, read-only/disabled)
     - Note: Email changes require verification, handled separately
- **UI Elements:**
  - Save button with loading state
  - Cancel button (reset form)
  - Success toast/message
- **State:**
  - Form values
  - Loading state
  - Success/error states
- **Client-side Actions:**
  - Call to `/api/auth/profile` PATCH endpoint
  - Update local state on success

#### 1.4.6 Preferences Form

**Component: `PreferencesForm.tsx` (New)**

- **File:** `src/components/profile/PreferencesForm.tsx`
- **Type:** React component
- **Purpose:** Edit dietary preferences (crucial for MVP success criteria)
- **Form Fields:**
  1. `diet` (select dropdown)
     - Options: none, vegan, vegetarian, pescatarian, keto, paleo, halal, kosher
  2. `allergens` (multi-select or tag input)
     - Common allergens: peanuts, tree nuts, dairy, eggs, soy, wheat, fish, shellfish
     - Custom allergen input
  3. `dislikedIngredients` (tag input with autocomplete)
     - Free-form text input
     - Add/remove tags
  4. `calorieTarget` (number input, optional)
     - Validation: Must be positive integer
     - Unit: calories per day
- **UI Elements:**
  - Save button with loading state
  - Reset to defaults button
  - Success message
  - Helpful tooltips/info icons
- **State:**
  - Form values
  - Loading state
  - Validation errors
  - Success/error states
- **Client-side Actions:**
  - Call to `/api/profile/preferences` endpoint
  - Update local state on success
  - Show success message encouraging recipe generation with new preferences

#### 1.4.7 Account Settings

**Component: `AccountSettings.tsx` (New)**

- **File:** `src/components/profile/AccountSettings.tsx`
- **Type:** React component
- **Purpose:** Security and account management
- **Sections:**
  1. **Change Password**
     - Fields: currentPassword, newPassword, confirmNewPassword
     - Button to open change password dialog
  2. **Email Management**
     - Display current email
     - Button to change email (opens dialog)
     - Show verification status
  3. **Delete Account**
     - Button to delete account (with confirmation dialog)
     - Warning about data loss
- **Components:**
  - `ChangePasswordDialog` (modal/dialog component)
  - `ChangeEmailDialog` (modal/dialog component)
  - `DeleteAccountDialog` (confirmation modal)

### 1.5 Validation and Error Handling

#### 1.5.1 Client-side Validation

**Validation Library:** Zod (matches backend validation)

- **Location:** `src/lib/validation/auth.validation.ts` (new file)
- **Schemas:**
  - `signUpSchema` - email, password, displayName validation
  - `signInSchema` - email, password validation
  - `forgotPasswordSchema` - email validation
  - `resetPasswordSchema` - password, confirmPassword validation
  - `updateProfileSchema` - displayName validation
  - `updatePreferencesSchema` - diet, allergens, disliked_ingredients, calorie_target

**Validation Timing:**

- On blur (field loses focus) - for individual fields
- On submit - for complete form validation
- Real-time for password strength and confirmation matching

#### 1.5.2 Error Message Display

**Error Display Patterns:**

1. **Field-level errors:**
   - Display below the input field
   - Red text color with error icon
   - ARIA live region for screen reader announcements

2. **Form-level errors:**
   - Display at top of form
   - Alert component with dismiss button
   - Used for server errors (network, invalid credentials, etc.)

3. **Success messages:**
   - Toast notifications (top-right corner)
   - Auto-dismiss after 5 seconds
   - Green color with checkmark icon

4. **Network errors:**
   - Generic message: "Unable to connect. Please check your internet connection and try again"
   - Retry button where appropriate

#### 1.5.3 Loading States

**Loading Indicators:**

- Form submit buttons: Change to "Processing..." or "Signing in..." with spinner
- Disable form inputs during submission
- Global loading overlay for page-level operations (sign out, redirect)

### 1.6 Important UI/UX Scenarios

#### Scenario 1: New User Registration Flow

1. User lands on `/` (landing page)
2. Clicks "Sign Up" button → navigates to `/sign-up`
3. Fills out sign-up form (email, password, display name)
4. Submits form → client-side validation
5. If valid → POST to `/api/auth/sign-up`
6. If email confirmation required:
   - Redirect to `/email-confirmation` with success message
   - User checks email and clicks verification link
   - Verification link redirects to `/sign-in` with success message
   - User signs in → redirected to `/recipes`
7. If email confirmation not required:
   - Automatically signed in
   - Redirect to `/recipes`
8. First-time user prompted to complete profile (preferences) via banner/modal

#### Scenario 2: Returning User Sign In Flow

1. User lands on `/` → sees landing page with "Sign In" button
2. Clicks "Sign In" → navigates to `/sign-in`
3. Fills email and password
4. Submits form → POST to `/api/auth/sign-in`
5. If successful:
   - Set session cookie
   - Redirect to `/recipes`
6. If credentials invalid:
   - Show error message: "Invalid email or password"
   - Form remains filled (except password)
7. If account not confirmed:
   - Show error with link to resend verification email

#### Scenario 3: Password Recovery Flow

1. User on `/sign-in` page → clicks "Forgot password?"
2. Redirects to `/forgot-password`
3. Enters email → submits form
4. POST to `/api/auth/forgot-password`
5. Always show success message (security best practice)
6. User receives email with reset link
7. Clicks link → redirects to `/reset-password?token=xxxxx`
8. Page validates token on load
9. If valid → shows password reset form
10. If invalid → shows error with link to request new reset
11. User enters new password → submits
12. POST to `/api/auth/reset-password` with token
13. If successful → redirect to `/sign-in` with success message
14. User signs in with new password

#### Scenario 4: Accessing Protected Page When Not Authenticated

1. User navigates directly to `/recipes` (not authenticated)
2. Server-side check: `getAuthenticatedUser(Astro)` returns null
3. Server responds with redirect to `/sign-in?redirect=/recipes`
4. After successful sign in:
   - Check for `redirect` query parameter
   - Redirect to original requested page (`/recipes`)

#### Scenario 5: User Updating Dietary Preferences

1. Authenticated user navigates to `/profile`
2. Sees three sections: Profile, Preferences, Account Settings
3. Scrolls to Preferences section
4. Selects "vegetarian" from diet dropdown
5. Adds allergens: "peanuts", "shellfish"
6. Adds disliked ingredients: "mushrooms", "olives"
7. Sets calorie target: 2000
8. Clicks "Save Preferences"
9. Client-side validation passes
10. PATCH to `/api/profile/preferences`
11. Success → show toast "Preferences saved successfully! Ready to generate personalized recipes"
12. Preferences now apply to all future recipe AI modifications

#### Scenario 6: User Signs Out

1. Authenticated user clicks user menu in header
2. Dropdown opens showing "Profile" and "Sign Out"
3. User clicks "Sign Out"
4. `SignOutButton` component calls Supabase `auth.signOut()`
5. Clears session cookie
6. Redirects to `/sign-in` with message "You have been signed out"

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints Structure

All authentication endpoints will follow RESTful conventions and use server-side rendering (SSR) with Astro's API routes.

**Base Path:** `/api/auth/`

#### 2.1.1 Sign Up Endpoint

**Endpoint:** `POST /api/auth/sign-up`

- **File:** `src/pages/api/auth/sign-up.ts`
- **Purpose:** Register new user account
- **Authentication:** None required
- **Request Body:**
  ```typescript
  {
    email: string
    password: string
    displayName?: string
  }
  ```
- **Validation:**
  - Use Zod schema: `signUpPayloadSchema`
  - Email format validation
  - Password strength validation (min 8 chars, complexity)
  - Display name max length (100 chars)
- **Business Logic:**
  1. Validate request payload
  2. Check if email already exists (handled by Supabase)
  3. Call Supabase Auth `signUp()` method
  4. Create user profile record in `user_profiles` table
  5. If email confirmation enabled:
     - Send verification email (Supabase handles this)
     - Return success with `emailConfirmationRequired: true`
  6. If email confirmation disabled:
     - Set session cookie
     - Return success with session data
- **Response (Success - 201 Created):**
  ```typescript
  {
    user: {
      id: string;
      email: string;
    }
    emailConfirmationRequired: boolean;
    message: string;
  }
  ```
- **Error Responses:**
  - 400 Bad Request - validation errors
  - 409 Conflict - email already registered
  - 500 Internal Server Error - unexpected errors
- **Error Response Format:**
  ```typescript
  {
    error: {
      code: "VALIDATION_ERROR" | "EMAIL_EXISTS" | "INTERNAL_ERROR"
      message: string
      details?: Record<string, unknown>
    }
  }
  ```

#### 2.1.2 Sign In Endpoint

**Endpoint:** `POST /api/auth/sign-in`

- **File:** `src/pages/api/auth/sign-in.ts`
- **Purpose:** Authenticate user and create session
- **Authentication:** None required
- **Request Body:**
  ```typescript
  {
    email: string
    password: string
    rememberMe?: boolean
  }
  ```
- **Validation:**
  - Use Zod schema: `signInPayloadSchema`
  - Email format validation
  - Password not empty
- **Business Logic:**
  1. Validate request payload
  2. Call Supabase Auth `signInWithPassword()` method
  3. Set session cookie (httpOnly, secure, sameSite)
  4. If `rememberMe` is true → extend session duration
  5. Return success with user data
- **Response (Success - 200 OK):**
  ```typescript
  {
    user: {
      id: string;
      email: string;
      emailConfirmed: boolean;
    }
    message: string;
  }
  ```
- **Error Responses:**
  - 400 Bad Request - validation errors
  - 401 Unauthorized - invalid credentials
  - 403 Forbidden - email not confirmed
  - 429 Too Many Requests - rate limit exceeded
  - 500 Internal Server Error
- **Security:**
  - Rate limiting: max 5 attempts per 15 minutes per email
  - Log failed attempts for security monitoring

#### 2.1.3 Sign Out Endpoint

**Endpoint:** `POST /api/auth/sign-out`

- **File:** `src/pages/api/auth/sign-out.ts`
- **Purpose:** End user session
- **Authentication:** Optional (can be called when session is expired)
- **Request Body:** None
- **Business Logic:**
  1. Call Supabase Auth `signOut()` method
  2. Clear session cookie
  3. Return success
- **Response (Success - 200 OK):**
  ```typescript
  {
    message: 'Signed out successfully';
  }
  ```
- **Error Responses:**
  - 500 Internal Server Error

#### 2.1.4 Forgot Password Endpoint

**Endpoint:** `POST /api/auth/forgot-password`

- **File:** `src/pages/api/auth/forgot-password.ts`
- **Purpose:** Initiate password reset flow
- **Authentication:** None required
- **Request Body:**
  ```typescript
  {
    email: string;
  }
  ```
- **Validation:**
  - Email format validation
- **Business Logic:**
  1. Validate email format
  2. Call Supabase Auth `resetPasswordForEmail()` method
  3. Supabase sends password reset email if account exists
  4. Always return success (security: don't reveal if email exists)
- **Response (Success - 200 OK):**
  ```typescript
  {
    message: 'If an account exists with this email, you will receive password reset instructions';
  }
  ```
- **Error Responses:**
  - 400 Bad Request - invalid email format
  - 429 Too Many Requests - rate limit (max 3 requests per hour per email)
  - 500 Internal Server Error

#### 2.1.5 Reset Password Endpoint

**Endpoint:** `POST /api/auth/reset-password`

- **File:** `src/pages/api/auth/reset-password.ts`
- **Purpose:** Complete password reset with token
- **Authentication:** None required (token-based)
- **Request Body:**
  ```typescript
  {
    token: string; // from email link
    password: string;
  }
  ```
- **Validation:**
  - Token format validation
  - Password strength validation
- **Business Logic:**
  1. Validate token and password
  2. Call Supabase Auth `verifyOtp()` with token
  3. Update password using `updateUser()` method
  4. Return success
- **Response (Success - 200 OK):**
  ```typescript
  {
    message: 'Password reset successfully';
  }
  ```
- **Error Responses:**
  - 400 Bad Request - validation errors
  - 401 Unauthorized - invalid or expired token
  - 500 Internal Server Error

#### 2.1.6 Verify Email Endpoint

**Endpoint:** `GET /api/auth/verify-email`

- **File:** `src/pages/api/auth/verify-email.ts`
- **Purpose:** Handle email verification callback
- **Authentication:** None required (token-based)
- **Query Parameters:**
  ```typescript
  {
    token: string;
    type: 'signup' | 'email_change';
  }
  ```
- **Business Logic:**
  1. Extract token from query parameters
  2. Call Supabase Auth `verifyOtp()` method
  3. If successful:
     - Set session cookie
     - Redirect to `/recipes` for signup
     - Redirect to `/profile` for email change
  4. If failed:
     - Redirect to `/email-confirmation?error=invalid_token`
- **Response:** HTTP redirect (302)
- **Error Handling:**
  - Invalid token → redirect with error message
  - Expired token → redirect with option to resend

#### 2.1.7 Resend Verification Email Endpoint

**Endpoint:** `POST /api/auth/resend-verification`

- **File:** `src/pages/api/auth/resend-verification.ts`
- **Purpose:** Resend email verification
- **Authentication:** Optional (can be used by anonymous users who just signed up)
- **Request Body:**
  ```typescript
  {
    email: string;
  }
  ```
- **Business Logic:**
  1. Validate email
  2. Call Supabase Auth `resend()` method
  3. Always return success (security best practice)
- **Response (Success - 200 OK):**
  ```typescript
  {
    message: 'Verification email sent';
  }
  ```
- **Error Responses:**
  - 429 Too Many Requests - rate limit (max 3 per hour per email)

#### 2.1.8 Get Current User Endpoint

**Endpoint:** `GET /api/auth/me`

- **File:** `src/pages/api/auth/me.ts`
- **Purpose:** Get current authenticated user's information
- **Authentication:** Required (session cookie or Bearer token)
- **Request Body:** None
- **Business Logic:**
  1. Validate session/token
  2. Get user from Supabase Auth
  3. Fetch user profile from `user_profiles` table
  4. Return combined user data
- **Response (Success - 200 OK):**
  ```typescript
  {
    user: {
      id: string
      email: string
      emailConfirmed: boolean
      profile: {
        displayName: string | null
        diet: DietType
        allergens: string[]
        dislikedIngredients: string[]
        calorieTarget: number | null
        createdAt: string
        updatedAt: string
      }
    }
  }
  ```
- **Error Responses:**
  - 401 Unauthorized - not authenticated
  - 404 Not Found - user profile not found
  - 500 Internal Server Error

#### 2.1.9 Update Profile Endpoint

**Endpoint:** `PATCH /api/auth/profile`

- **File:** `src/pages/api/auth/profile.ts`
- **Purpose:** Update user profile information (display name)
- **Authentication:** Required
- **Request Body:**
  ```typescript
  {
    displayName?: string
  }
  ```
- **Validation:**
  - Display name max length (100 chars)
- **Business Logic:**
  1. Validate request payload
  2. Get authenticated user ID
  3. Update `user_profiles` table
  4. Return updated profile
- **Response (Success - 200 OK):**
  ```typescript
  {
    profile: {
      displayName: string | null;
      updatedAt: string;
    }
    message: 'Profile updated successfully';
  }
  ```
- **Error Responses:**
  - 400 Bad Request - validation errors
  - 401 Unauthorized
  - 500 Internal Server Error

#### 2.1.10 Update Preferences Endpoint

**Endpoint:** `PATCH /api/profile/preferences`

- **File:** `src/pages/api/profile/preferences.ts`
- **Purpose:** Update dietary preferences (critical for MVP)
- **Authentication:** Required
- **Request Body:**
  ```typescript
  {
    diet?: DietType
    allergens?: string[]
    dislikedIngredients?: string[]
    calorieTarget?: number | null
  }
  ```
- **Validation:**
  - Diet must be valid enum value
  - Allergens array validation
  - Calorie target must be positive integer
- **Business Logic:**
  1. Validate request payload
  2. Get authenticated user ID
  3. Update `user_profiles` table
  4. Return updated preferences
- **Response (Success - 200 OK):**
  ```typescript
  {
    preferences: {
      diet: DietType
      allergens: string[]
      dislikedIngredients: string[]
      calorieTarget: number | null
      updatedAt: string
    }
    message: "Preferences updated successfully"
  }
  ```
- **Error Responses:**
  - 400 Bad Request - validation errors
  - 401 Unauthorized
  - 500 Internal Server Error

#### 2.1.11 Change Password Endpoint

**Endpoint:** `POST /api/auth/change-password`

- **File:** `src/pages/api/auth/change-password.ts`
- **Purpose:** Change password for authenticated user
- **Authentication:** Required
- **Request Body:**
  ```typescript
  {
    currentPassword: string;
    newPassword: string;
  }
  ```
- **Validation:**
  - Current password not empty
  - New password strength validation
  - New password different from current
- **Business Logic:**
  1. Validate request payload
  2. Verify current password (re-authenticate)
  3. Call Supabase Auth `updateUser()` to change password
  4. Return success
- **Response (Success - 200 OK):**
  ```typescript
  {
    message: 'Password changed successfully';
  }
  ```
- **Error Responses:**
  - 400 Bad Request - validation errors
  - 401 Unauthorized - current password incorrect
  - 500 Internal Server Error

#### 2.1.12 Delete Account Endpoint

**Endpoint:** `DELETE /api/auth/account`

- **File:** `src/pages/api/auth/account.ts`
- **Purpose:** Delete user account and all associated data
- **Authentication:** Required
- **Request Body:**
  ```typescript
  {
    password: string; // confirmation
    confirmation: 'DELETE MY ACCOUNT';
  }
  ```
- **Business Logic:**
  1. Validate password for confirmation
  2. Verify confirmation string matches exactly
  3. Soft delete all user's recipes (set `deleted_at`)
  4. Soft delete all user's recipe variants
  5. Delete user profile
  6. Call Supabase Auth admin API to delete user
  7. Clear session
  8. Return success
- **Response (Success - 200 OK):**
  ```typescript
  {
    message: 'Account deleted successfully';
  }
  ```
- **Error Responses:**
  - 400 Bad Request - validation errors
  - 401 Unauthorized - password incorrect
  - 500 Internal Server Error

### 2.2 Data Models and DTOs

#### 2.2.1 Authentication DTOs

**File:** `src/types.ts` (extend existing file)

```typescript
// ============================================================================
// Authentication DTOs
// ============================================================================

/** Sign up request payload */
export type SignUpCommand = {
  email: string;
  password: string;
  displayName?: string;
};

/** Sign up response */
export type SignUpResponseDTO = {
  user: {
    id: string;
    email: string;
  };
  emailConfirmationRequired: boolean;
  message: string;
};

/** Sign in request payload */
export type SignInCommand = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

/** Sign in response */
export type SignInResponseDTO = {
  user: {
    id: string;
    email: string;
    emailConfirmed: boolean;
  };
  message: string;
};

/** Forgot password request */
export type ForgotPasswordCommand = {
  email: string;
};

/** Reset password request */
export type ResetPasswordCommand = {
  token: string;
  password: string;
};

/** Change password request */
export type ChangePasswordCommand = {
  currentPassword: string;
  newPassword: string;
};

/** Resend verification email request */
export type ResendVerificationCommand = {
  email: string;
};

/** Current user response (extends UserProfileEntity) */
export type CurrentUserDTO = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  profile: UserProfileDTO | null;
};

/** User profile DTO */
export type UserProfileDTO = Omit<UserProfileEntity, 'user_id'> & {
  hasCompletedPreferences: boolean; // computed: checks if diet/allergens/etc set
};

/** Update profile command */
export type UpdateProfileCommand = {
  displayName?: string | null;
};

/** Update preferences command (already exists as UpdateUserProfileCommand, but make it partial) */
export type UpdatePreferencesCommand = Partial<
  Pick<
    UserProfileEntity,
    'diet' | 'allergens' | 'disliked_ingredients' | 'calorie_target'
  >
>;

/** Delete account command */
export type DeleteAccountCommand = {
  password: string;
  confirmation: string;
};

/** Generic success response */
export type SuccessResponseDTO = {
  message: string;
};
```

#### 2.2.2 Extended User Profile Model

The existing `user_profiles` table schema (from migration) already supports all required fields:

- `display_name` - user's chosen display name
- `diet` - dietary preference enum
- `allergens` - array of allergen strings
- `disliked_ingredients` - array of disliked ingredient strings
- `calorie_target` - daily calorie target (integer)
- `extra` - JSONB field for future extensions

**No database changes required** for authentication implementation.

### 2.3 Input Validation

#### 2.3.1 Validation Schemas

**File:** `src/lib/validation/auth.validation.ts` (new file)

```typescript
import { z } from 'zod';

// Password validation: min 8 chars, at least one number, one uppercase, one lowercase
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter');

// Email validation
const emailSchema = z.string().email('Please enter a valid email address');

// Sign up payload validation
export const signUpPayloadSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().max(100).optional(),
});

// Sign in payload validation
export const signInPayloadSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Forgot password payload validation
export const forgotPasswordPayloadSchema = z.object({
  email: emailSchema,
});

// Reset password payload validation
export const resetPasswordPayloadSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// Change password payload validation
export const changePasswordPayloadSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// Update profile payload validation
export const updateProfilePayloadSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
});

// Diet type enum validation
export const dietTypeSchema = z.enum([
  'none',
  'vegan',
  'vegetarian',
  'pescatarian',
  'keto',
  'paleo',
  'halal',
  'kosher',
]);

// Update preferences payload validation
export const updatePreferencesPayloadSchema = z.object({
  diet: dietTypeSchema.optional(),
  allergens: z.array(z.string().max(50)).optional(),
  disliked_ingredients: z.array(z.string().max(100)).optional(),
  calorie_target: z.number().int().positive().nullable().optional(),
});

// Delete account payload validation
export const deleteAccountPayloadSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
});

// Validation helper function
export function validatePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ApiError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: createValidationError('Validation failed', error.errors),
      };
    }
    throw error;
  }
}
```

#### 2.3.2 Validation Integration

Each API endpoint will:

1. Accept raw request body
2. Call `validatePayload()` with appropriate schema
3. If validation fails → return 400 Bad Request with error details
4. If validation succeeds → proceed with business logic

**Example usage:**

```typescript
// In sign-up endpoint
const result = validatePayload(signUpPayloadSchema, requestBody);
if (!result.success) {
  return createApiErrorResponse(result.error);
}
// Use result.data (now type-safe and validated)
```

### 2.4 Exception Handling

#### 2.4.1 Extended Error Types

**File:** `src/lib/errors/api-errors.ts` (extend existing file)

Add new error codes for authentication:

```typescript
// Existing error codes
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  // New authentication error codes
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'WEAK_PASSWORD'
  | 'ACCOUNT_LOCKED';

// New error factory functions
export function createEmailExistsError(): ApiError {
  return new ApiError(
    409,
    'EMAIL_EXISTS',
    'An account with this email already exists'
  );
}

export function createInvalidCredentialsError(): ApiError {
  return new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
}

export function createEmailNotConfirmedError(): ApiError {
  return new ApiError(
    403,
    'EMAIL_NOT_CONFIRMED',
    'Please verify your email address before signing in'
  );
}

export function createInvalidTokenError(): ApiError {
  return new ApiError(
    401,
    'INVALID_TOKEN',
    'The provided token is invalid or has expired'
  );
}

export function createRateLimitError(retryAfter?: number): ApiError {
  return new ApiError(
    429,
    'RATE_LIMIT_EXCEEDED',
    'Too many requests. Please try again later',
    { retryAfter }
  );
}
```

#### 2.4.2 Supabase Error Mapping

**File:** `src/lib/errors/supabase-error-mapper.ts` (new file)

```typescript
import { AuthError } from '@supabase/supabase-js';
import {
  ApiError,
  createEmailExistsError,
  createInvalidCredentialsError,
  createEmailNotConfirmedError,
  createInvalidTokenError,
  createRateLimitError,
} from './api-errors';

/**
 * Maps Supabase Auth errors to application ApiError instances
 */
export function mapSupabaseAuthError(error: AuthError): ApiError {
  // Supabase error codes and their mappings
  switch (error.message) {
    case 'User already registered':
      return createEmailExistsError();

    case 'Invalid login credentials':
      return createInvalidCredentialsError();

    case 'Email not confirmed':
      return createEmailNotConfirmedError();

    case 'Token has expired':
    case 'Invalid token':
      return createInvalidTokenError();

    case 'Email rate limit exceeded':
      return createRateLimitError(3600); // 1 hour in seconds

    default:
      // Log unexpected error for monitoring
      console.error('Unexpected Supabase auth error:', error);
      return new ApiError(
        500,
        'INTERNAL_ERROR',
        'An unexpected error occurred'
      );
  }
}

/**
 * Safely execute Supabase auth operation and map errors
 */
export async function executeSupabaseAuth<T>(
  operation: () => Promise<{ data: T | null; error: AuthError | null }>
): Promise<T> {
  const { data, error } = await operation();

  if (error) {
    throw mapSupabaseAuthError(error);
  }

  if (!data) {
    throw new ApiError(
      500,
      'INTERNAL_ERROR',
      'No data returned from authentication'
    );
  }

  return data;
}
```

#### 2.4.3 Global Error Handler

Each API endpoint follows this error handling pattern:

```typescript
export const POST: APIRoute = async (context) => {
  try {
    // 1. Validate input
    const validation = validatePayload(schema, requestBody)
    if (!validation.success) {
      return createApiErrorResponse(validation.error)
    }

    // 2. Execute business logic (with Supabase error mapping)
    const result = await executeSupabaseAuth(
      () => context.locals.supabase.auth.signUp(...)
    )

    // 3. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // 4. Handle errors
    if (error instanceof ApiError) {
      return createApiErrorResponse(error)
    }

    // Unexpected errors
    console.error('Unexpected error:', error)
    return createApiErrorResponse(
      new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
    )
  }
}
```

### 2.5 Server-Side Rendering Updates

#### 2.5.1 Middleware Enhancement

**File:** `src/middleware/index.ts` (update existing file)

Current middleware only adds Supabase client to context. Need to enhance it to:

1. Check for session cookie on every request
2. Validate session and attach user to context
3. Handle session refresh if needed

**Updated middleware:**

```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';

export const onRequest = defineMiddleware(async (context, next) => {
  // Add Supabase client to context
  context.locals.supabase = supabaseClient;

  // Check for session cookie
  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  if (accessToken && refreshToken) {
    // Set session in Supabase client
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      // Invalid session - clear cookies
      context.cookies.delete('sb-access-token');
      context.cookies.delete('sb-refresh-token');
    } else if (data.session) {
      // Valid session - refresh cookies if renewed
      if (data.session.access_token !== accessToken) {
        context.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      if (data.session.refresh_token !== refreshToken) {
        context.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    }
  }

  return next();
});
```

#### 2.5.2 Protected Page Pattern

**Helper Function:** `src/lib/auth/get-authenticated-user.ts` (already exists)

Current implementation is correct. Pages using this helper should follow this pattern:

```astro
---
import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user';

export const prerender = false; // Force SSR

const user = await getAuthenticatedUser(Astro);

if (!user) {
  // Store current URL for post-login redirect
  const redirectTo = Astro.url.pathname + Astro.url.search;
  return Astro.redirect(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
}

// Continue with page rendering - user is authenticated
---

<!-- Page content -->
```

#### 2.5.3 Authentication State in Layouts

**File:** `src/layouts/Layout.astro` (update)

Pass authentication state to layout:

```astro
---
import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user';
import Header from '@/components/Header.astro';

interface Props {
  title?: string;
  showHeader?: boolean;
  requireAuth?: boolean;
}

const {
  title = 'AI Healthy Meal',
  showHeader = true,
  requireAuth = false,
} = Astro.props;

export const prerender = false;

const user = await getAuthenticatedUser(Astro);

if (requireAuth && !user) {
  return Astro.redirect('/sign-in');
}
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body>
    {showHeader && <Header user={user} />}
    <main class="min-h-screen">
      <slot />
    </main>
  </body>
</html>
```

#### 2.5.4 Session Cookie Management

**Cookie Configuration:**

All authentication endpoints that create/update sessions must set cookies with these properties:

```typescript
// Access token cookie
context.cookies.set('sb-access-token', session.access_token, {
  path: '/',
  httpOnly: true,
  secure: import.meta.env.PROD, // HTTPS only in production
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

// Refresh token cookie
context.cookies.set('sb-refresh-token', session.refresh_token, {
  path: '/',
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
});
```

**Cookie Clearing (Sign Out):**

```typescript
context.cookies.delete('sb-access-token', { path: '/' });
context.cookies.delete('sb-refresh-token', { path: '/' });
```

#### 2.5.5 Configuration in astro.config.mjs

**File:** `astro.config.mjs` (already configured correctly)

Current configuration is correct:

- `output: "server"` - enables SSR for all pages by default
- `adapter: node({ mode: "standalone" })` - Node.js adapter for deployment
- Pages can opt-out with `export const prerender = true`

**No changes required to astro.config.mjs**

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

#### 3.1.1 Authentication Flow Overview

**Supabase Auth** provides comprehensive authentication services:

- User registration and login
- Email verification
- Password reset
- Session management
- JWT token generation and validation
- OAuth providers (future extension)

**Integration Points:**

1. **Client Configuration:**
   - File: `src/db/supabase.client.ts` (already exists)
   - Uses Supabase URL and anonymous key from environment variables
   - Single client instance shared across application

2. **Environment Variables:**
   - File: `src/env.d.ts` (already configured)
   - Required variables:
     - `SUPABASE_URL` - Supabase project URL
     - `SUPABASE_KEY` - Supabase anonymous/public key
   - Variables must be set in `.env` file (not committed to git)

3. **Context Integration:**
   - Supabase client added to `context.locals` in middleware
   - Available in all API routes and Astro pages
   - Type-safe via `src/env.d.ts` declaration

#### 3.1.2 Authentication Methods

**Primary Method: Email/Password Authentication**

Supabase Auth provides email/password authentication out of the box:

1. **User Registration:**

   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'secure-password',
     options: {
       data: {
         display_name: 'User Name', // metadata
       },
       emailRedirectTo: 'https://app.example.com/verify-email',
     },
   });
   ```

2. **User Login:**

   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'secure-password',
   });
   ```

3. **User Logout:**

   ```typescript
   const { error } = await supabase.auth.signOut();
   ```

4. **Get Current User:**

   ```typescript
   const { data, error } = await supabase.auth.getUser();
   // or with token
   const { data, error } = await supabase.auth.getUser(token);
   ```

5. **Session Management:**
   ```typescript
   const { data, error } = await supabase.auth.setSession({
     access_token: 'token',
     refresh_token: 'refresh-token',
   });
   ```

#### 3.1.3 Email Verification Configuration

**Supabase Project Settings:**

1. **Enable Email Confirmation:**
   - Navigate to Authentication > Settings in Supabase Dashboard
   - Toggle "Enable email confirmations" to ON
   - Users must verify email before they can sign in

2. **Email Templates:**
   - Customize email templates in Authentication > Email Templates
   - Templates to configure:
     - Confirmation email (sign up)
     - Password reset email
     - Email change confirmation
   - Variables available: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`

3. **Email Redirect URLs:**
   - Configure allowed redirect URLs in Authentication > URL Configuration
   - Add application domain: `https://app.example.com`
   - Add local development URL: `http://localhost:3000`

**Verification Flow:**

1. User signs up → Supabase sends verification email
2. User clicks link in email → redirects to `/api/auth/verify-email?token=xxx&type=signup`
3. API endpoint verifies token → sets session → redirects to `/recipes`

#### 3.1.4 Password Reset Flow

**Reset Password Request:**

```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://app.example.com/reset-password',
});
```

**Reset Password Completion:**

```typescript
// Verify OTP token from email
const { data, error } = await supabase.auth.verifyOtp({
  token: resetToken,
  type: 'recovery',
});

// Update password
const { data, error } = await supabase.auth.updateUser({
  password: newPassword,
});
```

**Flow Diagram:**

1. User requests password reset → POST `/api/auth/forgot-password`
2. Supabase sends reset email with token
3. User clicks link → redirects to `/reset-password?token=xxx`
4. Page validates token → shows reset form
5. User submits new password → POST `/api/auth/reset-password`
6. API verifies token and updates password
7. Redirect to `/sign-in` with success message

### 3.2 Session Management

#### 3.2.1 Session Storage Strategy

**Cookie-Based Sessions (Recommended for SSR):**

- Store access token and refresh token in HTTP-only cookies
- Cookies managed by server (Astro API routes)
- Secure against XSS attacks (JavaScript cannot access)
- Automatically sent with every request

**Cookie Names:**

- `sb-access-token` - JWT access token (short-lived, 1 hour)
- `sb-refresh-token` - Refresh token (long-lived, 30 days)

**Cookie Properties:**

- `httpOnly: true` - prevents JavaScript access
- `secure: true` - HTTPS only (production)
- `sameSite: 'lax'` - CSRF protection
- `path: '/'` - available site-wide

#### 3.2.2 Session Lifecycle

**Session Creation (Sign In/Sign Up):**

1. User successfully authenticates
2. Supabase returns session with access_token and refresh_token
3. Server sets cookies with tokens
4. Redirect to protected page

**Session Validation (Every Request):**

1. Middleware extracts tokens from cookies
2. Calls `supabase.auth.setSession()` to restore session
3. If valid → session available for page/API route
4. If invalid/expired → attempts refresh
5. If refresh fails → clear cookies, redirect to sign in

**Session Refresh:**

1. Access token expires (1 hour)
2. Middleware detects expired access token
3. Uses refresh token to get new access token
4. Updates cookies with new tokens
5. Continues with request

**Session Termination (Sign Out):**

1. User clicks sign out
2. Call `supabase.auth.signOut()`
3. Delete cookies
4. Redirect to sign in page

#### 3.2.3 Token Validation

**Bearer Token Authentication (API Clients):**

For programmatic API access (e.g., mobile apps, third-party integrations):

1. Client obtains access token via sign in
2. Client includes token in `Authorization` header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. API endpoint validates token:
   ```typescript
   const authHeader = request.headers.get('authorization');
   if (authHeader?.startsWith('Bearer ')) {
     const token = authHeader.substring(7);
     const { data, error } = await supabase.auth.getUser(token);
     // Validate user
   }
   ```

**Dual Authentication Support:**

API endpoints support both:

- Cookie-based authentication (for browser requests)
- Bearer token authentication (for API clients)

Example from existing code (`src/pages/api/recipes/index.ts`):

```typescript
let userId: string | undefined;

if (authHeader?.startsWith('Bearer ')) {
  // API token authentication
  const token = authHeader.substring('Bearer '.length);
  const { data, error } = await locals.supabase.auth.getUser(token);
  if (error || !data.user) {
    throw createUnauthorizedError();
  }
  userId = data.user.id;
} else {
  // Session cookie authentication
  const { data, error } = await locals.supabase.auth.getUser();
  if (error || !data.user) {
    throw createUnauthorizedError();
  }
  userId = data.user.id;
}
```

### 3.3 Security Considerations

#### 3.3.1 Password Security

**Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Supabase handles password hashing (bcrypt)

**Storage:**

- Never store passwords in plain text
- Supabase stores hashed passwords in `auth.users` table
- Application never has access to plain passwords

#### 3.3.2 Rate Limiting

**Protection Against Brute Force:**

Implement rate limiting on authentication endpoints:

1. **Sign In:**
   - Max 5 attempts per 15 minutes per email
   - Return 429 Too Many Requests on exceeded
   - Lock account after 10 failed attempts in 1 hour

2. **Password Reset:**
   - Max 3 requests per hour per email
   - Prevent email enumeration by always returning success

3. **Email Verification:**
   - Max 3 resend requests per hour per email

**Implementation Options:**

1. **Supabase Built-in Rate Limiting:**
   - Configure in Supabase Dashboard → Authentication → Settings
   - Set rate limits per endpoint

2. **Application-Level Rate Limiting:**
   - Use Redis or in-memory store to track attempts
   - Implement in middleware or endpoint handlers

**Example (simple in-memory rate limiter):**

```typescript
// src/lib/auth/rate-limiter.ts
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record || now > record.resetAt) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}
```

#### 3.3.3 CSRF Protection

**Strategy:**

- Use `sameSite: 'lax'` on cookies (already configured)
- For state-changing operations, consider CSRF tokens
- Supabase JWT tokens provide additional protection

**For Critical Operations:**

For highly sensitive operations (delete account, change email), add additional CSRF protection:

1. Generate CSRF token on page render
2. Include token in form as hidden field
3. Validate token on submission

#### 3.3.4 XSS Protection

**Measures:**

1. **HTTP-Only Cookies:**
   - Tokens stored in HTTP-only cookies
   - JavaScript cannot access tokens

2. **Content Security Policy:**
   - Add CSP headers to responses
   - Restrict script sources

3. **Input Sanitization:**
   - Validate and sanitize all user inputs
   - Use Zod schemas for validation
   - React automatically escapes rendered content

#### 3.3.5 SQL Injection Protection

**Supabase Protections:**

- Row Level Security (RLS) policies enforce data access rules
- Supabase client uses parameterized queries
- No raw SQL execution from application code

**RLS Policies:**

Already implemented in database migration:

- `user_profiles`: Users can only access their own profile
- `recipes`: Users can only access their own recipes
- `recipe_variants`: Access tied to recipe ownership
- `generation_logs`: Users can only view their own logs

### 3.4 Error Handling and Logging

#### 3.4.1 Authentication Error Logging

**What to Log:**

1. **Failed Login Attempts:**
   - Email (hashed for privacy)
   - Timestamp
   - IP address
   - Reason (invalid password, account not found, etc.)

2. **Successful Sign Ups:**
   - User ID
   - Email (hashed)
   - Timestamp
   - Email confirmation status

3. **Password Reset Requests:**
   - Email (hashed)
   - Timestamp
   - IP address

4. **Account Security Events:**
   - Password changes
   - Email changes
   - Account deletions

**Logging Implementation:**

```typescript
// src/lib/auth/auth-logger.ts
export function logAuthEvent(
  event:
    | 'sign_up'
    | 'sign_in'
    | 'sign_out'
    | 'password_reset'
    | 'account_deleted',
  details: {
    userId?: string;
    email?: string;
    success: boolean;
    error?: string;
    ip?: string;
  }
) {
  // Hash email for privacy
  const hashedEmail = details.email
    ? crypto.createHash('sha256').update(details.email).digest('hex')
    : undefined;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      userId: details.userId,
      emailHash: hashedEmail,
      success: details.success,
      error: details.error,
      ip: details.ip,
    })
  );

  // In production, send to logging service (e.g., Sentry, LogRocket)
}
```

#### 3.4.2 User-Facing Error Messages

**Principles:**

1. **Be Helpful, Not Technical:**
   - Bad: "JWT token expired"
   - Good: "Your session has expired. Please sign in again"

2. **Don't Reveal Sensitive Info:**
   - Bad: "No account found with this email"
   - Good: "Invalid email or password"

3. **Provide Next Steps:**
   - Bad: "Authentication failed"
   - Good: "Unable to sign in. Please check your credentials or reset your password"

4. **Use Consistent Tone:**
   - Friendly and professional
   - Apologetic for errors ("We're sorry...")
   - Encouraging for success ("Great! You're all set")

### 3.5 Supabase Configuration

#### 3.5.1 Required Supabase Project Settings

**Authentication Settings:**

1. **Enable Email/Password Provider:**
   - Navigate to Authentication > Providers
   - Enable "Email" provider
   - Configure email templates

2. **Email Confirmation:**
   - Toggle "Enable email confirmations" to ON (recommended)
   - Or set to OFF for faster testing (users can sign in immediately)

3. **Email Templates:**
   - Confirmation email: Use default or customize
   - Recovery email: Use default or customize
   - Include application branding and logo

4. **Session Settings:**
   - JWT expiry: 3600 seconds (1 hour) - default
   - Refresh token expiry: 2592000 seconds (30 days) - default

5. **Security:**
   - Enable "Secure email change" (requires confirmation)
   - Enable "Secure password change" (requires re-authentication)

#### 3.5.2 URL Configuration

**Allowed Redirect URLs:**

Add to Authentication > URL Configuration:

- Production: `https://yourdomain.com/**`
- Staging: `https://staging.yourdomain.com/**`
- Local Development: `http://localhost:3000/**`

**Site URL:**

Set to primary application URL:

- Production: `https://yourdomain.com`

#### 3.5.3 SMTP Configuration (Production)

**For Production Email Delivery:**

1. Navigate to Authentication > Email Settings
2. Choose SMTP provider (SendGrid, AWS SES, Mailgun, etc.)
3. Configure SMTP credentials:
   - Host
   - Port
   - Username
   - Password
   - From email address
   - From name
4. Test email delivery

**Development:**

- Supabase provides default email service for development
- Limited to 3 emails per hour per user
- For testing, use email confirmation OFF or use real SMTP early

#### 3.5.4 Row Level Security (RLS) Verification

**Verify RLS Policies:**

1. Navigate to Database > Policies in Supabase Dashboard
2. Confirm policies exist for:
   - `user_profiles`
   - `recipes`
   - `recipe_variants`
   - `generation_logs`
3. Test policies:
   - Create test users
   - Verify users can only access their own data
   - Verify anonymous users have appropriate restrictions

### 3.6 Testing Strategy

#### 3.6.1 Manual Testing Checklist

**Sign Up Flow:**

- [ ] Valid email and password → success
- [ ] Invalid email format → validation error
- [ ] Weak password → validation error
- [ ] Existing email → error "Email already registered"
- [ ] Email confirmation required → redirects to confirmation page
- [ ] Email confirmation not required → signs in automatically

**Sign In Flow:**

- [ ] Valid credentials → success, redirect to /recipes
- [ ] Invalid password → error "Invalid email or password"
- [ ] Non-existent email → same error (don't reveal)
- [ ] Unconfirmed email → error "Please verify your email"
- [ ] Remember me checked → extended session
- [ ] Redirect to originally requested page after sign in

**Password Reset Flow:**

- [ ] Valid email → success message (always)
- [ ] Invalid email → same success message (security)
- [ ] Receive reset email
- [ ] Click reset link → valid token
- [ ] Enter new password → success
- [ ] Expired token → error with option to request new
- [ ] Sign in with new password → success

**Profile Management:**

- [ ] View profile → displays current data
- [ ] Update display name → saves successfully
- [ ] Update preferences (diet, allergens) → saves
- [ ] Invalid calorie target (negative) → validation error
- [ ] Change password (correct current) → success
- [ ] Change password (incorrect current) → error

**Session Management:**

- [ ] Access protected page when authenticated → success
- [ ] Access protected page when not authenticated → redirect to sign in
- [ ] Session expires → prompt to re-authenticate
- [ ] Sign out → clears session, redirects to sign in
- [ ] Multiple tabs → session consistent across tabs

**Security:**

- [ ] Cannot access other users' recipes
- [ ] Cannot modify other users' profiles
- [ ] SQL injection attempts → rejected
- [ ] XSS attempts → sanitized
- [ ] Rate limiting → blocks excessive attempts

#### 3.6.2 Automated Testing Approach

**Unit Tests:**

- Validation schemas (Zod)
- Error mappers
- Helper functions

**Integration Tests:**

- API endpoints with mock Supabase
- Authentication flows
- Session management

**End-to-End Tests:**

- Full user journeys (sign up to recipe creation)
- Use Playwright or Cypress
- Test against real Supabase test project

---

## 4. IMPLEMENTATION CHECKLIST

### 4.1 Phase 1: Backend Infrastructure

**Priority: High**

- [ ] Create validation schemas (`src/lib/validation/auth.validation.ts`)
- [ ] Extend error types (`src/lib/errors/api-errors.ts`)
- [ ] Create Supabase error mapper (`src/lib/errors/supabase-error-mapper.ts`)
- [ ] Update types file with auth DTOs (`src/types.ts`)
- [ ] Create rate limiter utility (`src/lib/auth/rate-limiter.ts`)
- [ ] Create auth logger utility (`src/lib/auth/auth-logger.ts`)

### 4.2 Phase 2: API Endpoints

**Priority: High**

- [ ] Implement sign-up endpoint (`src/pages/api/auth/sign-up.ts`)
- [ ] Implement sign-in endpoint (`src/pages/api/auth/sign-in.ts`)
- [ ] Implement sign-out endpoint (`src/pages/api/auth/sign-out.ts`)
- [ ] Implement forgot password endpoint (`src/pages/api/auth/forgot-password.ts`)
- [ ] Implement reset password endpoint (`src/pages/api/auth/reset-password.ts`)
- [ ] Implement verify email endpoint (`src/pages/api/auth/verify-email.ts`)
- [ ] Implement resend verification endpoint (`src/pages/api/auth/resend-verification.ts`)
- [ ] Implement get current user endpoint (`src/pages/api/auth/me.ts`)
- [ ] Implement update profile endpoint (`src/pages/api/auth/profile.ts`)
- [ ] Implement update preferences endpoint (`src/pages/api/profile/preferences.ts`)
- [ ] Implement change password endpoint (`src/pages/api/auth/change-password.ts`)
- [ ] Implement delete account endpoint (`src/pages/api/auth/account.ts`)

### 4.3 Phase 3: Frontend Components

**Priority: High**

- [ ] Create SignUpForm component (`src/components/auth/SignUpForm.tsx`)
- [ ] Create SignInForm component (`src/components/auth/SignInForm.tsx`)
- [ ] Create ForgotPasswordForm component (`src/components/auth/ForgotPasswordForm.tsx`)
- [ ] Create ResetPasswordForm component (`src/components/auth/ResetPasswordForm.tsx`)
- [ ] Create ProfileForm component (`src/components/profile/ProfileForm.tsx`)
- [ ] Create PreferencesForm component (`src/components/profile/PreferencesForm.tsx`)
- [ ] Create AccountSettings component (`src/components/profile/AccountSettings.tsx`)
- [ ] Create UserMenu component (`src/components/auth/UserMenu.tsx`)
- [ ] Create SignOutButton component (`src/components/auth/SignOutButton.tsx`)
- [ ] Create Header component (`src/components/Header.astro`)

### 4.4 Phase 4: Pages and Routes

**Priority: High**

- [ ] Create sign-up page (`src/pages/sign-up.astro`)
- [ ] Create sign-in page (`src/pages/sign-in.astro`)
- [ ] Create forgot password page (`src/pages/forgot-password.astro`)
- [ ] Create reset password page (`src/pages/reset-password.astro`)
- [ ] Create email confirmation page (`src/pages/email-confirmation.astro`)
- [ ] Create profile page (`src/pages/profile.astro`)
- [ ] Update landing page with auth state (`src/pages/index.astro`)
- [ ] Update recipes page to include header (`src/pages/recipes.astro`)

### 4.5 Phase 5: Middleware and Layouts

**Priority: High**

- [ ] Update middleware for session management (`src/middleware/index.ts`)
- [ ] Update Layout component with header (`src/layouts/Layout.astro`)
- [ ] Update environment types if needed (`src/env.d.ts`)

### 4.6 Phase 6: Supabase Configuration

**Priority: High**

- [ ] Configure email/password provider in Supabase Dashboard
- [ ] Set up email templates (confirmation, reset)
- [ ] Configure allowed redirect URLs
- [ ] Set up SMTP for production (if applicable)
- [ ] Verify RLS policies are active
- [ ] Test email delivery

### 4.7 Phase 7: Testing

**Priority: Medium**

- [ ] Manual testing of all flows (use checklist)
- [ ] Fix any bugs found during testing
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Test session persistence and refresh
- [ ] Test rate limiting
- [ ] Test error scenarios

### 4.8 Phase 8: Documentation and Polish

**Priority: Low**

- [ ] Add inline code comments
- [ ] Document environment variables setup
- [ ] Create user guide for authentication features
- [ ] Update README with auth information
- [ ] Add helpful error messages and tooltips
- [ ] Improve loading states and transitions
- [ ] Add success animations/feedback

---

## 5. SUCCESS CRITERIA

### 5.1 Functional Requirements

**All authentication flows must work:**

- [ ] Users can sign up with email and password
- [ ] Users can sign in with email and password
- [ ] Users can recover forgotten passwords
- [ ] Users can update their profile and preferences
- [ ] Users can change their password
- [ ] Users can sign out
- [ ] Users can delete their account

**Protected routes work correctly:**

- [ ] Authenticated users can access `/recipes`
- [ ] Authenticated users can access `/profile`
- [ ] Unauthenticated users are redirected to `/sign-in`
- [ ] After sign in, users are redirected to originally requested page

**Session management works:**

- [ ] Sessions persist across page reloads
- [ ] Sessions refresh automatically before expiry
- [ ] Sessions are cleared on sign out
- [ ] Multiple tabs share the same session

### 5.2 Non-Functional Requirements

**Security:**

- [ ] Passwords are never stored in plain text
- [ ] Sessions use HTTP-only cookies
- [ ] Rate limiting prevents brute force attacks
- [ ] CSRF protection is active
- [ ] XSS protection is active
- [ ] RLS policies enforce data access rules

**Performance:**

- [ ] Pages load within 2 seconds
- [ ] Form submissions respond within 1 second
- [ ] No unnecessary re-renders in React components
- [ ] Middleware adds minimal overhead (<100ms)

**User Experience:**

- [ ] All forms have clear validation messages
- [ ] Loading states are visible for async operations
- [ ] Success messages confirm completed actions
- [ ] Error messages are helpful and non-technical
- [ ] Forms are accessible (keyboard navigation, screen readers)
- [ ] UI is responsive on mobile and desktop

**Compatibility:**

- [ ] Works in Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Works on iOS Safari and Android Chrome
- [ ] Works with JavaScript disabled (graceful degradation)

### 5.3 MVP Success Criteria Alignment

**From PRD:**

- 90% of users have completed dietary preferences
  - ✅ Profile page prominently features preferences form
  - ✅ Success message encourages recipe generation after setting preferences
  - ✅ Empty state in recipes page can prompt to set preferences

- 75% of users generate recipes weekly
  - ✅ Authentication enables personalized recipe generation
  - ✅ Preferences stored and applied to all AI modifications
  - ✅ User ownership of recipes via authentication

---

## 6. FUTURE ENHANCEMENTS (Out of MVP Scope)

**OAuth Providers:**

- Google Sign In
- Apple Sign In
- Facebook Sign In

**Two-Factor Authentication (2FA):**

- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification codes

**Advanced Security:**

- Device tracking and management
- Suspicious activity detection
- IP-based restrictions

**User Management:**

- Admin panel for user management
- User roles and permissions
- Account suspension/banning

**Social Features:**

- Profile visibility settings
- User following
- Activity feeds

---

## 7. TECHNICAL DEPENDENCIES

### 7.1 External Services

**Supabase:**

- Version: Latest (compatible with `@supabase/supabase-js` v2.x)
- Required features: Auth, Database, RLS
- Account required: Yes (free tier sufficient for MVP)

**Email Service (Production):**

- Options: SendGrid, AWS SES, Mailgun, Postmark
- Required for production email delivery
- Development can use Supabase default

### 7.2 NPM Packages

**Already Installed:**

- `@supabase/supabase-js` - Supabase client
- `zod` - Schema validation
- `react` - UI components
- `astro` - Framework

**No New Dependencies Required**

### 7.3 Environment Variables

**Required:**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key

**Optional:**

- `SESSION_SECRET` - For additional encryption (if needed)
- `RATE_LIMIT_ENABLED` - Toggle rate limiting

---

## 8. DEPLOYMENT CONSIDERATIONS

### 8.1 Environment-Specific Settings

**Development:**

- Use local Supabase instance (optional) or cloud project
- Email confirmation can be disabled for faster testing
- Relaxed rate limits
- Detailed error messages

**Production:**

- Strict email confirmation
- SMTP configured for email delivery
- Strict rate limits
- Generic error messages (don't leak sensitive info)
- HTTPS only (secure cookies)
- Enable all security features

### 8.2 Environment Variables Setup

**Development (`.env.local`):**

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-anon-key
```

**Production (DigitalOcean/Docker):**

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-anon-key
NODE_ENV=production
```

### 8.3 Database Migrations

**Current Migration:**

- `20251102163750_create_initial_schema.sql` already includes `user_profiles` table
- RLS policies already configured
- No additional migrations needed for authentication

**Verification:**

- Run migration on production database
- Verify all tables exist
- Verify RLS is enabled
- Test with production Supabase credentials

---

## 9. MONITORING AND ANALYTICS

### 9.1 Key Metrics to Track

**User Acquisition:**

- Sign-up rate (per day/week)
- Sign-up completion rate (started vs completed)
- Email verification rate

**User Engagement:**

- Sign-in frequency
- Session duration
- Profile completion rate (especially preferences)

**Security:**

- Failed sign-in attempts
- Rate limit hits
- Password reset requests
- Account deletions

**Technical:**

- API response times
- Error rates (per endpoint)
- Session refresh success rate

### 9.2 Logging Strategy

**Events to Log:**

- User sign ups (with metadata)
- Sign ins (success and failure)
- Password resets
- Profile updates (especially preferences)
- Account deletions
- Security events (rate limits, suspicious activity)

**Log Storage:**

- Development: Console logs
- Production: Send to logging service (Sentry, LogRocket, etc.)

---

## 10. CONCLUSION

This specification provides a comprehensive blueprint for implementing user authentication and account management in the HealthyMeal MVP application. The design leverages Supabase Auth for robust security and scalability while maintaining simplicity appropriate for an MVP.

**Key Architectural Decisions:**

1. **Hybrid Astro/React Approach:** Static pages with interactive components provide optimal performance and user experience.

2. **Cookie-Based Sessions:** Secure, HTTP-only cookies protect against XSS attacks while supporting server-side rendering.

3. **Supabase Auth Integration:** Offloads complex authentication logic to a proven service, reducing development time and security risks.

4. **Comprehensive Validation:** Client-side and server-side validation using Zod ensures data integrity and provides immediate user feedback.

5. **Row Level Security:** Database-level security policies enforce proper data access, providing defense in depth.

**Implementation Priority:**

Focus on core authentication flows first (sign up, sign in, sign out), then add profile management and preferences. Email verification and password reset can be implemented in parallel.

**Success Measurement:**

The authentication system directly enables the MVP success criteria by allowing users to save preferences and associate recipes with their accounts, which are prerequisites for personalized recipe generation.

---

**Document End**
