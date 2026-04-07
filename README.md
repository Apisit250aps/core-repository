# @aps/next-api

โครงสร้างพื้นฐาน (boilerplate toolkit) สำหรับสร้าง API ด้วย **Hono** บน **Next.js** หรือ **Node.js**  
รองรับ MongoDB พร้อม type-safe schema validation ด้วย Zod และ auto-generated CRUD routes

---

## สารบัญ

- [@aps/next-api](#apsnext-api)
  - [สารบัญ](#สารบัญ)
  - [ติดตั้ง](#ติดตั้ง)
  - [โครงสร้าง Packages](#โครงสร้าง-packages)
  - [การใช้งาน](#การใช้งาน)
    - [1. กำหนด Schema และ Repository](#1-กำหนด-schema-และ-repository)
    - [2. สร้าง Controller](#2-สร้าง-controller)
    - [3. ลงทะเบียน Routes กับ Hono App](#3-ลงทะเบียน-routes-กับ-hono-app)
    - [4. ใช้งานกับ Next.js (Route Handler)](#4-ใช้งานกับ-nextjs-route-handler)
  - [Field Helpers](#field-helpers)
  - [Types](#types)
  - [Scripts](#scripts)
  - [Powered By](#powered-by)
  - [Install From Git](#install-from-git)
  - [Usage](#usage)
  - [Release Flow](#release-flow)
  - [Notes](#notes)

---

## ติดตั้ง

ติดตั้งผ่าน Git URL (npm):

```bash
npm install github:Apisit250aps/next-api
```

หรือระบุ version tag:

```bash
npm install github:Apisit250aps/next-api#v0.1.0
```

---

## โครงสร้าง Packages

| Package | คำอธิบาย |
|---|---|
| `@aps/next-api-types` | Shared TypeScript types เช่น `ApiResponse`, `Entity`, `CreateInput`, `UpdateInput` |
| `@aps/next-api-core` | Abstract classes `Controller`, `Repository` และ field helpers |
| `@aps/next-api` | Root package สำหรับติดตั้งผ่าน Git |

---

## การใช้งาน

### 1. กำหนด Schema และ Repository

ใช้ `BaseEntity` เพื่อสร้าง schema ที่มี `id`, `createdAt`, `updatedAt`, `deletedAt` โดยอัตโนมัติ  
จากนั้น extend `Repository` และกำหนด `collectionName` กับ `schema`

```ts
// repositories/user.repo.ts
import { z } from 'zod'
import Repository from '@aps/next-api/repository'
import { BaseEntity, StringField, EmailField } from '@aps/next-api/field'
import type { CreateInput, UpdateInput } from '@aps/next-api/types'
import client from '../lib/mongo'

const userSchema = BaseEntity({
  name: StringField(),
  email: EmailField(),
  password: StringField(),
})

type User = z.infer<typeof userSchema>
type CreateUserInput = CreateInput<User>
type UpdateUserInput = UpdateInput<User>

class UserRepository extends Repository<User> {
  readonly collectionName = 'users'
  readonly schema = userSchema

  // กำหนด MongoDB indexes (optional)
  override readonly indexes = [
    {
      key: { email: 1 },
      unique: true,
      name: 'email_unique_index',
      partialFilterExpression: { deletedAt: null },
    },
  ]
}

export const userRepo = new UserRepository(client)
export type { User, CreateUserInput, UpdateUserInput }
```

Repository มี built-in methods ดังนี้:

| Method | คำอธิบาย |
|---|---|
| `findAll(filters)` | ดึงเอกสารทั้งหมด (กรอง `deletedAt: null` อัตโนมัติ) |
| `findById(id)` | ดึงเอกสารตาม `id` |
| `create(item)` | สร้างเอกสารใหม่ (validate ผ่าน Zod ก่อน) |
| `update(id, item)` | อัปเดตเอกสาร (อัปเดต `updatedAt` อัตโนมัติ) |
| `delete(id)` | Soft delete (ตั้ง `deletedAt` เป็น timestamp ปัจจุบัน) |
| `safeValidate(item)` | Validate ข้อมูลโดยไม่ throw error |
| `validate(item)` | Validate ข้อมูลและ throw error ถ้าไม่ผ่าน |
| `aggregate(...)` | รัน MongoDB aggregation pipeline |

---

### 2. สร้าง Controller

Extend `Controller` และกำหนด `repository` กับ `prefix` (URL prefix ของ routes)

```ts
// controllers/user.controller.ts
import Controller from '@aps/next-api/controller'
import { userRepo, type User } from '../repositories/user.repo'

class UserController extends Controller<User> {
  readonly repository = userRepo
  readonly prefix = 'users' // → routes จะขึ้นต้นด้วย /users
}

export default UserController
```

เรียก `super.registered()` เพื่อลงทะเบียน CRUD routes อัตโนมัติ หรือเพิ่ม custom routes ได้:

```ts
class UserController extends Controller<User> {
  readonly repository = userRepo
  readonly prefix = 'users'

  protected override registered(): void {
    super.registered() // ลงทะเบียน CRUD routes มาตรฐาน

    // เพิ่ม custom route
    this.getRoute('me', async (c) => {
      return c.json({ message: 'current user' })
    })
  }
}
```

**CRUD Routes ที่ถูกสร้างอัตโนมัติ:**

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/users` | ดึงรายการทั้งหมด |
| `GET` | `/users/:id` | ดึงข้อมูลตาม ID |
| `POST` | `/users` | สร้างข้อมูลใหม่ |
| `PUT` | `/users/:id` | อัปเดตข้อมูล |
| `DELETE` | `/users/:id` | ลบข้อมูล (soft delete) |

---

### 3. ลงทะเบียน Routes กับ Hono App

```ts
// app.ts
import { Hono } from 'hono'
import UserController from './controllers/user.controller'

const app = new Hono()
const users = new UserController()

app.route('/api', users.routes())

export default app
```

---

### 4. ใช้งานกับ Next.js (Route Handler)

```ts
// app/api/[[...route]]/route.ts
import { handle } from 'hono/vercel'
import { Hono } from 'hono'
import UserController from '@/controllers/user.controller'

const app = new Hono().basePath('/api')
const users = new UserController()

app.route('/', users.routes())

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
```

---

## Field Helpers

Field helpers ทั้งหมดเป็น wrapper ของ Zod schema สำหรับนิยาม schema ที่อ่านง่ายขึ้น

```ts
import {
  BaseEntity,
  StringField,
  NumberField,
  BooleanField,
  DateField,
  DateTimeField,
  UUIDField,
  EmailField,
  URLField,
  AutoIdField,
  ArrayField,
  ObjectField,
  EnumField,
  OptionalField,
  NullableField,
} from '@aps/next-api/field'

const productSchema = BaseEntity({
  name: StringField(),
  price: NumberField(),
  inStock: BooleanField(),
  imageUrl: URLField(),
  tags: ArrayField(StringField()),
  status: EnumField('active', 'inactive'),
  description: OptionalField(StringField()),
})
```

`BaseEntity` จะเพิ่ม fields เหล่านี้โดยอัตโนมัติ:

| Field | Type | Default |
|---|---|---|
| `id` | `string` (UUID v7) | auto-generated |
| `createdAt` | `Date` | `new Date()` |
| `updatedAt` | `Date` | `new Date()` |
| `deletedAt` | `Date \| null` | `null` |

---

## Types

```ts
import type {
  ApiResponse,
  Entity,
  CreateInput,
  UpdateInput,
  ValidationError,
  ValidationResult,
  RepositoryContract,
  ResponseStatus,
  ControllerContract,
} from '@aps/next-api/types'

// ApiResponse — รูปแบบ response มาตรฐาน
type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  error?: string
}
```

---

## Scripts

```bash
# รัน dev server
npm run dev

# Build packages (types + core)
npm run build:packages

# Build ทุกอย่าง
npm run build:all

# Lint
npm run lint

# Clean build outputs
npm run clean:packages
```

---

## Powered By

| Library | คำอธิบาย | Docs |
|---|---|---|
| [**Hono**](https://hono.dev) | Web framework ประสิทธิภาพสูง รองรับ Edge, Node.js, Next.js | [Docs](https://hono.dev/docs) · [Next.js Adapter](https://hono.dev/docs/getting-started/vercel) |
| [**MongoDB**](https://www.mongodb.com) | NoSQL database | [Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/) · [CRUD Ops](https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/) |
| [**Zod**](https://zod.dev) | TypeScript-first schema validation | [Docs](https://zod.dev/) · [Primitives](https://zod.dev/?id=primitives) · [Objects](https://zod.dev/?id=objects) |
| [**UUID (v7)**](https://github.com/uuidjs/uuid) | สร้าง ID ตามลำดับเวลา (time-ordered UUID) | [README](https://github.com/uuidjs/uuid#readme) · [UUID v7 spec (RFC 9562)](https://www.rfc-editor.org/rfc/rfc9562#name-uuid-version-7) |
| [**TypeScript**](https://www.typescriptlang.org) | Type-safe JavaScript | [Docs](https://www.typescriptlang.org/docs/) · [tsconfig reference](https://www.typescriptlang.org/tsconfig) |
| [**tsx**](https://tsx.is) | TypeScript runner สำหรับ development | [Docs](https://tsx.is/) · [Watch mode](https://tsx.is/node/watch) |

---

> Built by [Apisit250aps](https://github.com/Apisit250aps)

## Install From Git

Use the tagged release for reproducible installs:

```bash
npm install git+https://github.com/Apisit250aps/next-api.git#v0.1.0
```

The root package is published from git as `@aps/next-api` and exposes stable subpaths.

## Usage

```ts
import { Controller, Repository } from '@aps/next-api'
import { BaseEntity, EmailField, StringField } from '@aps/next-api/field'
import type { ApiResponse } from '@aps/next-api/types'
```

Available subpaths:

- `@aps/next-api`
- `@aps/next-api/controller`
- `@aps/next-api/repository`
- `@aps/next-api/base-controller`
- `@aps/next-api/base-repository`
- `@aps/next-api/field`
- `@aps/next-api/types`

## Release Flow

1. Verify the build with `npm run build:all`.
2. Commit the release changes.
3. Tag the release with `git tag v0.1.0`.
4. Push commits and tag with `git push origin main --tags`.

## Notes

- Git installs use committed code only.
- The `prepare` script builds workspace package dist files during git installation.
- Release notes are tracked in `release/versions.md`.
