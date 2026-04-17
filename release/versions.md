# Versions

## v0.1.1

Release date: 2026-04-17

### Highlights

- Exposed `BaseController` and `BaseRepository` as named public exports for direct subclassing.
- Added dedicated `./base-controller` and `./base-repository` subpath exports on both the root package and `@aps/next-api-core`.
- Expanded `field.ts` with a full set of Zod-backed field helpers.
- Strengthened type safety across the types package with new shared contracts and utility types.
- Added duplicate route detection in `BaseController` to catch conflicting route registrations at startup.

### New Exports

```ts
// Direct access to base classes
import { BaseController, BaseRepository } from '@aps/next-api'
import BaseController from '@aps/next-api/base-controller'
import BaseRepository from '@aps/next-api/base-repository'
```

### New Field Helpers (`@aps/next-api/field`)

| Helper | Description |
|---|---|
| `DateField()` | `z.date()` with string coercion (date-only) |
| `DateTimeField()` | `z.date()` with string coercion (full datetime) |
| `UUIDField()` | `z.uuid()` |
| `URLField()` | `z.url()` |
| `AutoIdField()` | UUID v7 string with auto-default |
| `ArrayField(schema)` | `z.array(schema)` |
| `ObjectField(shape)` | `z.object(shape)` |
| `EnumField(...values)` | `z.enum(values)` |
| `OptionalField(field)` | wraps any field with `.optional()` |
| `NullableField(field)` | wraps any field with `.nullable()` |

### New Types (`@aps/next-api/types`)

- `ValidationError` — `{ message: string }`
- `ValidationResult<T>` — discriminated union of success/failure validation result
- `RepositoryContract<T>` — interface defining the full repository surface (`safeValidate`, `validate`, `create`, `findById`, `findAll`, `update`, `delete`)
- `ResponseStatus` — `200 | 201 | 400 | 404 | 500`
- `ControllerContract<T, Ctx>` — interface defining the standard CRUD controller surface
- `CreateHandlerInput<T>` / `UpdateHandlerInput<T>` — convenience aliases

### Breaking Changes

None. All additions are backwards-compatible with v0.1.0.

### Install

```bash
npm install git+https://github.com/Apisit250aps/next-api.git#v0.1.1
```

### Git Tag

```bash
git tag v0.1.1
git push origin v0.1.1
```

---

## v0.1.0

Release date: 2026-04-07

### Highlights

- Promoted the repository root to an installable package for git-based usage.
- Added stable subpath exports for controller, repository, field, and shared types.
- Kept workspace package builds in `prepare` so git installs build distributable files automatically.
- Documented the recommended tagged install flow for reproducible installs.

### Install

```bash
npm install git+https://github.com/Apisit250aps/next-api.git#v0.1.0
```

### Import

```ts
import { Controller, Repository } from '@aps/next-api'
import { BaseEntity, EmailField, StringField } from '@aps/next-api/field'
import type { ApiResponse } from '@aps/next-api/types'
```

### Release Notes

- Root package name is `@aps/next-api`.
- Git installs now rely on root package exports instead of transitive workspace hoisting.
- Package contents explicitly include workspace packages so `npm pack` and git installs include built artifacts.

### Git Tag

```bash
git tag v0.1.0
git push origin v0.1.0
```
