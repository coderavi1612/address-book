# Address Book PDF Builder - Setup Guide

## Project Setup Complete ✓

This document describes the completed setup for Task 1 of the Address Book PDF Builder project.

## Installed Dependencies

### Production Dependencies
- `@supabase/ssr` - Supabase SSR client for Next.js
- `@supabase/supabase-js` - Supabase JavaScript client
- `zustand` - State management
- `zod` - Schema validation
- `react-hook-form` - Form management
- `@hookform/resolvers` - Zod resolver for react-hook-form
- `@dnd-kit/core` - Drag and drop core
- `@dnd-kit/sortable` - Sortable drag and drop
- `@dnd-kit/utilities` - Drag and drop utilities
- `@react-pdf/renderer` - PDF generation
- `sonner` - Toast notifications
- `clsx` - Conditional className utility
- `tailwind-merge` - Tailwind class merging
- `tailwindcss-animate` - Tailwind animations
- `class-variance-authority` - Component variants
- `lucide-react` - Icon library

### Development Dependencies
- `fast-check` - Property-based testing
- `@testing-library/react` - React component testing
- `@testing-library/dom` - DOM testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - Jest DOM matchers
- `vitest` - Test runner
- `@vitejs/plugin-react` - Vite React plugin
- `jsdom` - DOM implementation for testing

## Environment Configuration

### Files Created
- `.env.local` - Local environment variables (not committed)
- `.env.example` - Example environment variables template

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** You need to replace these placeholder values with your actual Supabase project credentials.

## shadcn/ui Components

### Installed Components
- `button` - Button component
- `input` - Input field component
- `textarea` - Textarea component
- `dialog` - Dialog/modal component
- `sonner` - Toast notification component

### Configuration Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `lib/utils.ts` - Utility functions (cn helper)

## Testing Setup

### Configuration Files
- `vitest.config.ts` - Vitest configuration
- `vitest.setup.ts` - Test setup file

### Test Scripts
```bash
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
```

## Build Verification

The project has been verified to build successfully:
```bash
npm run build     # ✓ Build successful
```

## Next Steps

1. Configure Supabase:
   - Create a Supabase project
   - Update `.env.local` with your Supabase credentials
   - Run database migrations (Task 2)

2. Start development:
   ```bash
   npm run dev
   ```

3. Begin implementing features according to the task list

## Project Structure

```
address-book/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
│   └── utils.ts          # cn helper
├── .env.local           # Environment variables (not committed)
├── .env.example         # Environment variables template
├── components.json      # shadcn/ui config
├── tailwind.config.ts   # Tailwind config
├── vitest.config.ts     # Vitest config
└── package.json         # Dependencies
```

## Theme Configuration

The application uses a white theme optimized for print:
- Background: White (#ffffff)
- Foreground: Dark grey (#1a1a1a)
- Primary: Blue (#3b82f6)
- Border: Light grey (#e5e5e5)

All CSS variables are defined in `app/globals.css`.
