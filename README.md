# HealthyMeal (MVP)

An AI-powered recipe management application that adapts recipes to your personal dietary needs and preferences.

## Overview

HealthyMeal solves the challenge of customizing online recipes to match individual dietary requirements. Using AI and user preferences, the app suggests personalized recipe modifications that align with your nutritional goals.

## Key Features

- **Recipe Management**: Save, view, browse, and delete recipes in text format
- **User Accounts**: Simple authentication system to manage your personal recipe collection
- **Dietary Preferences**: User profile page for storing food preferences and nutritional requirements
- **AI Integration**: Modify recipes according to your dietary preferences using AI

## Tech Stack

### Frontend
- [Astro](https://astro.build/) v5 - Fast, efficient web framework with minimal JavaScript
- [React](https://react.dev/) v19 - Interactive UI components where needed
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Accessible React component library

### Backend
- [Supabase](https://supabase.com/) - Complete backend solution providing:
    - PostgreSQL database
    - Backend-as-a-Service SDK
    - Built-in user authentication
    - Open-source and self-hostable

### AI
- [OpenRouter.ai](https://openrouter.ai/) - AI model integration providing:
    - Access to multiple AI models (OpenAI, Anthropic, Google, and more)
    - Cost-effective model selection
    - API key financial limits

### CI/CD & Hosting
- GitHub Actions - CI/CD pipelines
- DigitalOcean - Application hosting via Docker

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)
- Supabase account (for backend services)
- OpenRouter.ai API key (for AI features)

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-healthy-meal
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with:

```bash
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter.ai
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. Set up Supabase:

- Create a new Supabase project
- Run the migrations from `supabase/migrations/` directory
- Configure authentication settings

5. Run the development server:

```bash
npm run dev
```

6. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```md
.
├── src/
│   ├── layouts/            # Astro layouts
│   ├── pages/              # Astro pages
│   │   └── api/            # API endpoints
│   ├── middleware/         # Astro middleware
│   ├── components/         # UI components (Astro & React)
│   │   ├── auth/           # Authentication components
│   │   ├── recipes/        # Recipe management components
│   │   ├── ui/             # Shadcn/ui components
│   │   └── hooks/          # React hooks
│   ├── db/                 # Supabase clients and types
│   ├── lib/                # Services and helpers
│   │   ├── auth/           # Authentication utilities
│   │   ├── services/       # Business logic services
│   │   ├── validation/     # Input validation
│   │   └── errors/         # Error handling
│   ├── types.ts            # Shared types (Entities, DTOs)
│   ├── assets/             # Static internal assets
│   └── styles/             # Global styles
├── public/                 # Public assets
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migrations
```

## MVP Scope

### Included Features ✅
- Recipe CRUD operations (Create, Read, Update, Delete)
- User authentication and account management
- Dietary preferences profile management
- AI-powered recipe modifications based on user preferences

### Out of Scope ❌
- URL-based recipe import
- Rich multimedia support (recipe photos)
- Recipe sharing with other users
- Social features

## Success Criteria

- **90%** of users have completed dietary preferences in their profile
- **75%** of users generate one or more recipes per week

## Development Guidelines

### Coding Practices
- Use feedback from linters to improve code quality
- Prioritize error handling and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability
- Implement proper error logging and user-friendly error messages
- Use guard clauses to handle preconditions and invalid states early

### AI Development Support

This project is configured with AI development tools in `.cursor/rules/` directory to help with:
- Project structure understanding
- Coding best practices
- Tech stack guidelines
- Accessibility standards

## Contributing

Please follow the coding practices and guidelines defined in the project when contributing.

## License

MIT
