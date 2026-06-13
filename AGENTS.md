# Ghostfolio — Agent Guide

Nx v22 monorepo (TypeScript). Two apps: `api` (NestJS 11) and `client` (Angular 21.2). Two libs: `common` and `ui`.

## Key paths (tsconfig paths)

| Alias                  | Real path               |
| ---------------------- | ----------------------- |
| `@ghostfolio/api/*`    | `apps/api/src/*`        |
| `@ghostfolio/client/*` | `apps/client/src/app/*` |
| `@ghostfolio/common/*` | `libs/common/src/lib/*` |
| `@ghostfolio/ui/*`     | `libs/ui/src/lib/*`     |

## Dev setup

```bash
cp .env.dev .env
npm install                    # postinstall runs prisma generate
docker compose -f docker/docker-compose.dev.yml up -d   # PostgreSQL + Redis
npm run database:setup        # prisma db push + prisma db seed
```

### Start

```bash
npm run start:server          # API at http://localhost:3333
npm run start:client          # Client at https://localhost:4200/en (SSL, proxy to API)
```

## Commands

| Action               | Command                                                      |
| -------------------- | ------------------------------------------------------------ |
| Test all             | `npm test` (uses `dotenv-cli -e .env.example`)               |
| Test one project     | `npm run test:api`                                           |
| Test single file     | `npm run test:single` (example uses `object.helper.spec.ts`) |
| Lint all             | `npm run lint`                                               |
| Format check + write | `npm run format:check` / `npm run format:write`              |
| CI order             | lint → format:check → test → `npm run build:production`      |
| Prisma sync schema   | `npm run database:push`                                      |
| Prisma migration     | `npm run prisma migrate dev --name <desc>`                   |
| Prisma Studio        | `npm run database:gui`                                       |
| Build production     | `npm run build:production`                                   |
| Storybook (dev)      | `npm run start:storybook` (port 4400)                        |

Pre-commit hook: `nx affected:lint --base=main --head=HEAD --parallel=2 --quiet` then `nx format:write --uncommitted`.

## Architecture notes

- **Nx parallel is 1** in `nx.json` (tasks run serially by default).
- **ValidationPipe** globally: `forbidNonWhitelisted`, `transform`, `whitelist`. 10mb JSON body limit.
- **API versioning** via URI (`/api/v1/...`). Global prefix `api`, default version `1`.
- **Guards**: JWT + Passport. OIDC auth is experimental (behind `ENABLE_FEATURE_AUTH_OIDC`).
- **Queues**: Bull with Redis. Bull Board at `/admin/queues`.
- **Postinstall** runs `prisma generate`.
- **`NX_ADD_PLUGINS=false`** in `.env.dev` (legacy compatibility flag kept from Nx 18 upgrade).

## Framework quirks

- **Client** uses standalone components, `inject()` DI, `ChangeDetectionStrategy.OnPush`. Component selector prefix: `gf-`.
- **Styles**: SCSS + Bootstrap 4 utility classes + Angular Material + `open-color`. Component style default: `scss`.
- **i18n**: Angular built-in (`@angular/localize`). 12 locales in `apps/client/src/locales/` (`.xlf`). Source: `en`. Extract: `npm run extract-locales`.
- **PWA**: Service worker enabled (`@angular/service-worker`). `ngsw-config.json` at `apps/client/ngsw-config.json`.
- **Prettier**: single quotes, no trailing commas, 80 print width. Import sort: `@ghostfolio` → third-party → relative. HTML attribute sort for Angular plugins.
- **TypeScript**: `strict: false`, `strictNullChecks: false`. Many eslint rules set to `warn` (gradual migration in progress).
- **Angular CLI memory**: uses `node --max_old_space_size=32768`.
- **`.npmrc`**: `min-release-age=7` (blocks packages published <7 days ago).

## Testing

- Jest across all packages (`@nx/jest`). `passWithNoTests: true` globally.
- Client: `jest-preset-angular`, jsdom environment.
- API: `ts-jest`, node environment.
- Tests must be run through Nx: `nx test <project>`.
- The `npm test` script sources `.env.example` via `dotenv-cli` for test env vars.

## Dependency upgrade

| Framework       | Command                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| Angular (minor) | `npx npm-check-updates --upgrade --target "minor" --filter "/@angular.*/"`  |
| NestJS (minor)  | `npx npm-check-updates --upgrade --target "minor" --filter "/@nestjs.*/"`   |
| Nx              | `npx nx migrate latest` → `npm install` → `npx nx migrate --run-migrations` |

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
