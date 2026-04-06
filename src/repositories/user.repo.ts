import { z } from 'zod'
import Repository, {
  BaseEntitySchema,
  type CreateInput,
  type UpdateInput,
} from '../lib/repository'

const userSchema = BaseEntitySchema(
  z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
  }),
)

type User = z.infer<typeof userSchema>
type CreateUserInput = CreateInput<User>
type UpdateUserInput = UpdateInput<User>

class UserRepository extends Repository<User> {
  readonly collectionName = 'users'
  readonly schema = userSchema
  readonly indexes = [{ key: { email: 1 }, unique: true }]
}

export default UserRepository
export type { User, CreateUserInput, UpdateUserInput }
