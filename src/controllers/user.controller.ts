import Controller from '@/lib/controller'
import client from '@/lib/mongo'
import UserRepository, { type User } from '@/repositories/user.repo'

const userRepo = new UserRepository(client)

class UserController extends Controller<User> {
  readonly repository = userRepo
  readonly prefix = '/users'
}

export default UserController
