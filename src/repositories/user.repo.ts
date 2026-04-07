import { z } from 'zod'
import Repository, { BaseEntitySchema } from '@aps/next-api-core/repository'
import type { CreateInput, UpdateInput } from '@aps/next-api-types'
import type { MongoClient } from 'mongodb'
import client from '../lib/mongo'

const userSchema = BaseEntitySchema(
  z.object({
    name: z.string(),
    email: z.email(),
    password: z.string(),
  }),
)

type User = z.infer<typeof userSchema>
type CreateUserInput = CreateInput<User>
type UpdateUserInput = UpdateInput<User>

class UserRepository extends Repository<User> {
  constructor(client: MongoClient) {
    super(client, {
      collectionName: 'users',
      schema: userSchema,
      indexes: [{ key: { email: 1 }, unique: true }],
    })
  }
}

export const userRepo = new UserRepository(client)

export default UserRepository
export type { User, CreateUserInput, UpdateUserInput }
