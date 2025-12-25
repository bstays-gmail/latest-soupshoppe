# Soup Shoppe Daily Menu

## Overview

A restaurant menu management application for "Soup Shoppe" that allows staff to manage daily menus featuring soups, sandwiches, salads, and entrees. The system includes a public-facing menu display and an admin dashboard for menu configuration with AI-powered image generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: Zustand with persist middleware for local storage
- **Data Fetching**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Authentication**: Passport.js with local strategy, session-based auth using memory store
- **Password Security**: scrypt hashing with timing-safe comparison
- **API Pattern**: RESTful JSON APIs under `/api/*` routes

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with push-based schema sync
- **Tables**: users, daily_menus, menu_items, generated_images
- **Fallback**: JSON file storage in `data/daily_menus.json` for menu persistence

### Key Features
1. **Daily Menu Management**: Configure up to 6 soups plus specials (panini, sandwich, salad, entree) per day
2. **Menu Item Database**: Pre-populated catalog of menu items with custom item support
3. **AI Image Generation**: OpenAI-powered image generation for menu items via Replit AI Integrations
4. **Publish Workflow**: Draft/publish states for daily menus
5. **Public Menu Display**: Customer-facing view of today's menu
6. **Catering Inquiries**: Contact form with mailto integration

### Authentication Flow
- Session-based authentication with 7-day cookie expiration
- Protected admin routes require login
- Registration requires admin code for access control
- Password change functionality for authenticated users

## External Dependencies

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for image generation
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Database
- **PostgreSQL**: Primary data store
- **Environment Variables**: `DATABASE_URL` (also checks `/tmp/replitdb` for Replit deployments)

### Session Management
- **Environment Variables**: `SESSION_SECRET` (required for session encryption)

### Third-Party Libraries
- **Drizzle ORM**: Type-safe database queries with Zod schema generation
- **date-fns**: Date manipulation and formatting
- **Passport.js**: Authentication middleware
- **p-limit/p-retry**: Batch processing utilities for AI operations

### Static Assets
- Menu item images served from `/public/images/`
- Generated AI images stored in `/public/generated-images/`
- Custom fonts: Playfair Display (serif headings), Inter (body text)