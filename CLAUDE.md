# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock market analysis dashboard built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS. Features real-time stock data, charts, news analysis, and theme exploration with a mobile-first PWA design.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Architecture

### Routing Structure

Uses Next.js App Router with grouped layouts:
- `app/(MobileBottomNave)/` - Main pages with mobile bottom navigation (dashboard, news, settings, themes)
- `app/(header)/` - Pages with header layout
- `app/stock/[symbol]/` - Dynamic stock detail pages
- Grouped routes `(groupName)` provide layouts without affecting URLs

### Domain-Driven Design Pattern

Stock-related logic is organized in `domain/stock/` with clear separation:

```
domain/stock/
├── api/         - API fetch functions (e.g., fetch-stock-current-price.ts)
├── mappers/     - Transform DTOs to typed Models (e.g., stock-current-price.mapper.ts)
├── queries/     - TanStack Query hooks (e.g., use-stock-current-price.ts)
└── types/       - DTO and Model type definitions (*.dto.ts and *.model.ts)
```

**Data flow**: API → DTO → Mapper → Model → Query Hook → Component

When adding new data features, follow this pattern:
1. Create DTO type in `types/*.dto.ts`
2. Create Model type in `types/*.model.ts`
3. Write mapper in `mappers/*.mapper.ts` with safe defaults
4. Create fetch function in `api/fetch-*.ts`
5. Create React Query hook in `queries/use-*.ts`

### State Management

- **TanStack React Query** (v5) - Server state and API caching
  - Default staleTime: 60 seconds
  - Default gcTime: 5 minutes
  - Query keys follow pattern: `["resource-name", ...params]`
- **SWR** - Global client state via `lib/store.ts` (market state, stocks, anomalies, alerts)
- **React Hook Form + Zod** - Form state and validation

### HTTP Clients

Two separate HTTP clients in `lib/http/`:
- `client.ts` - Client-side fetch using `NEXT_PUBLIC_API_BASE_URL`
- `server.ts` - Server-side fetch using `API_BASE_URL` (cookie-aware)

Use the appropriate client based on component type (Client vs Server Component).

### Component Organization

- `components/ui/` - 56 shadcn/ui components (Radix UI primitives)
- `components/radar/` - Dashboard-specific components
- `components/stock/` - Stock detail page components
- Root-level components (`components/*.tsx`) - Shared layouts (Header, MobileBottomNav)

## Key Technical Details

### Type Safety

- Strict TypeScript mode enabled
- Path alias `@/*` maps to project root
- All API responses must be typed as DTOs
- Internal models provide safe defaults for missing/invalid data

### Mapper Pattern

DTOs often contain optional string values from APIs. Mappers transform them to typed models with safe defaults:

```typescript
// Always provide fallback values
const toNumber = (v?: string | null) => {
  const n = Number(String(v).replaceAll(",", ""))
  return Number.isFinite(n) ? n : 0
}
```

### Styling

- Tailwind CSS v4 with OKLch color space
- CSS variables for theming in `app/globals.css`
- `cn()` utility (`lib/utils.ts`) for className merging
- Theme system via `next-themes` (light/dark modes)
- Mobile-first responsive design with `lg:` breakpoints

### Import Aliases

Configured in both `tsconfig.json` and `components.json`:
- `@/components` → `./components`
- `@/lib` → `./lib`
- `@/hooks` → `./hooks`
- `@/ui` → `./components/ui`
- `@/utils` → `./lib/utils`

### Charts & Visualization

- **Recharts** - General-purpose React charts
- **Lightweight Charts** - High-performance stock candlestick charts
- Chart colors defined as CSS variables (--chart-1 through --chart-5)

### PWA Configuration

- Manifest generated in `app/manifest.ts`
- Middleware bypasses auth for PWA resources (manifest.webmanifest, sw.js, icons)
- Icons configured in root layout metadata

### Build Configuration

- `next.config.mjs` has `typescript.ignoreBuildErrors: true` - fix type errors before deploying
- `images.unoptimized: true` - image optimization disabled
- React 19 uses automatic JSX transform (`jsx: "react-jsx"`)

## Adding New Features

### New Stock Data Endpoint

1. Define DTO in `domain/stock/types/*.dto.ts`
2. Define Model in `domain/stock/types/*.model.ts`
3. Create mapper in `domain/stock/mappers/*.mapper.ts`
4. Create fetch function in `domain/stock/api/fetch-*.ts`
5. Create React Query hook in `domain/stock/queries/use-*.ts`
6. Use hook in components

### New UI Components

- Use existing shadcn/ui components from `components/ui/`
- For new shadcn components: Follow `components.json` config (new-york style, lucide icons)
- Domain-specific components go in `components/radar/` or `components/stock/`

### New Pages

- Add to `app/(MobileBottomNave)/` for pages with mobile nav
- Add to `app/(header)/` for pages with header only
- Dynamic routes use `[param]` syntax (e.g., `stock/[symbol]/page.tsx`)

## Common Patterns

### Query Hook Usage

```typescript
const { data, isLoading, isError } = useStockCurrentPrice(stockCode)

if (isLoading) return <div>Loading...</div>
if (isError) return <div>Error loading data</div>
return <div>{data.currentPrice}</div>
```

### Form with Validation

```typescript
const form = useForm<FormSchema>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... }
})
```

### Toast Notifications

Import from `sonner`:
```typescript
import { toast } from "sonner"
toast.success("Operation successful")
```

## Environment Variables

Check `.env` file for:
- `NEXT_PUBLIC_API_BASE_URL` - Client-side API endpoint
- `API_BASE_URL` - Server-side API endpoint
