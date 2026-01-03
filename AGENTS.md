# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router entrypoints (`app/layout.tsx`, `app/page.tsx`) and global styles (`app/globals.css`).
- `components/`: Page sections and shared components (e.g. `components/hero.tsx`).
- `components/ui/`: shadcn/ui + Radix primitives. Prefer consuming these rather than rewriting UI patterns.
- `hooks/`: Reusable React hooks (aliased as `@/hooks/...`).
- `lib/`: Utilities (e.g. `lib/utils.ts`, aliased as `@/lib/...`).
- `public/`: Static assets served from `/` (images, icons).
- `styles/`: Legacy/global CSS (currently `app/globals.css` is the active global stylesheet).

## Build, Test, and Development Commands

This repo uses `pnpm` (see `pnpm-lock.yaml`).

- `pnpm install`: Install dependencies.
- `pnpm dev`: Run the local dev server (Next.js).
- `pnpm build`: Production build (`next build`).
- `pnpm start`: Start the production server after a build.
- `pnpm lint`: Run ESLint (`eslint .`). If linting fails due to missing config/packages, add the appropriate ESLint setup for Next.js.

## Coding Style & Naming Conventions

- Language: TypeScript + React (see `tsconfig.json` with `strict: true`).
- Formatting: follow existing file style (2-space indentation, double quotes in TS/TSX).
- Components: `PascalCase` component names; files are `kebab-case.tsx` in `components/` and `components/ui/`.
- Imports: use the `@/*` path alias (e.g. `import { Header } from "@/components/header"`).
- Styling: Tailwind CSS (v4) + CSS variables; prefer utility classes for layout and keep design tokens in `app/globals.css`.

## Testing Guidelines

There is no test harness configured yet (no `test` script). If you add tests, also add a `pnpm test` script and document the runner (e.g. Vitest/Jest) plus naming like `*.test.ts(x)`.

## Commit & Pull Request Guidelines

This workspace doesn’t include Git history. Use a consistent convention such as Conventional Commits:

- `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`

For pull requests:

- Describe the change and the “why”.
- Include screenshots/GIFs for UI changes.
- Note any env vars/config changes and update documentation (prefer an `.env.example` if needed).
