# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate database schemas
- `pnpm db:push` - Push schema changes to the database
- `pnpm db:init` - Initialize database
- `pnpm db:seed-models` - Seed car models data
- `pnpm db:insert-models` - Insert car models data

## Code Style Guidelines
- **Imports**: Group imports by type (React, external libs, internal modules) and sort alphabetically
- **Formatting**: TypeScript with strict mode enabled, React function components with hooks
- **Types**: Use TypeScript interfaces/types for components, functions, and API data
- **Naming**: 
  - PascalCase for components
  - camelCase for variables, functions, instances
  - Use descriptive names that reflect purpose
- **Components**: Small, focused components with clear props interface
- **Error Handling**: Use try/catch blocks for async operations, display user-friendly errors with toast
- **File Structure**: Follow existing patterns in `/src/components` and `/src/routes`
- **CSS/Styling**: Use Tailwind with utility classes, organized with `cn()` helper for conditional classes
- **State Management**: Use React hooks (useState, useEffect, useCallback)
- **Forms**: React Hook Form with Zod validation