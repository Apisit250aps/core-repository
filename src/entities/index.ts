import type z from 'zod'

import { BaseEntity, StringField } from '@aps/next-api/entities'
import type { CreateInput, UpdateInput } from '@aps/next-api'

const PostEntity = BaseEntity({
  title: StringField(),
  content: StringField(),
  author: StringField(),
})

export type Post = z.infer<typeof PostEntity>
export type CreatePostInput = CreateInput<Post>
export type UpdatePostInput = UpdateInput<Post>
export { PostEntity }
