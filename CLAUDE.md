# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

This is a **Next.js 15 portfolio website** using the App Router pattern with React 19 and TypeScript.

### Project Structure

```
src/
├── app/              # Next.js App Router (layout.tsx, page.tsx, globals.css)
├── components/       # React components
│   └── ui/           # shadcn-style base components (Button, Card, Badge)
└── lib/              # Utilities and context providers
```

### Key Patterns

- **Path alias**: `@/*` maps to `./src/*`
- **Theme system**: React Context in `src/lib/theme-context.tsx` manages dark/light mode via CSS class on `<html>`. Theme persists to localStorage.
- **Styling**: Tailwind CSS v4 with CSS custom properties (oklch color space) defined in `globals.css`
- **UI components**: Built with class-variance-authority (CVA) for type-safe variants + Radix UI primitives for accessibility
- **Utility function**: `cn()` in `src/lib/utils.ts` merges Tailwind classes using clsx + tailwind-merge

### Configuration

- `components.json` - shadcn UI config (new-york style, neutral base color, Lucide icons)
- `tailwind.config.ts` - Dark mode via class toggle, custom color tokens
- Geist font family loaded via `next/font`
