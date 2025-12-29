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
│   ├── ui/           # shadcn-style base components (Button, Card, Badge)
│   └── clock-theme.tsx  # Live clock with time-based theme switching
└── lib/              # Utilities and context providers
    └── theme-context.tsx  # Theme state management
```

### Design System

**Layout**: Vertical centered container with `max-width: 640px`, responsive padding.

**Color Scheme**:
- Light theme: `#f5f5f5` (background), `#171717` (text), `#a3a3a3` (muted)
- Dark theme: `#171717` (background), `#f5f5f5` (text), `#a3a3a3` (muted)

**Page Sections**:
1. Header (name + clock/theme toggle)
2. Bio description
3. Projects section
4. Thoughts section (blog posts)
5. Cool Links section
6. Footer (social links)

### Theme System

The theme is controlled by a **live clock** (`ClockTheme` component) that:
- Displays current time in `HH:MM:SS` format
- Auto-switches theme based on time of day:
  - **Light mode**: 7:00 AM - 4:59 PM (hours 7-16)
  - **Dark mode**: 5:00 PM - 6:59 AM (hours 17-6)
- Allows manual override by clicking (resets at next time boundary)

Theme context in `src/lib/theme-context.tsx` manages state and applies CSS class on `<html>`.

### Key Patterns

- **Path alias**: `@/*` maps to `./src/*`
- **Styling**: Tailwind CSS v4 with CSS custom properties (hex colors) in `globals.css`
- **UI components**: Built with class-variance-authority (CVA) for type-safe variants
- **Utility function**: `cn()` in `src/lib/utils.ts` merges Tailwind classes

### Configuration

- `components.json` - shadcn UI config (new-york style, neutral base color, Lucide icons)
- `tailwind.config.ts` - Dark mode via class toggle
- Geist font family loaded via `next/font`
