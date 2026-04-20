import Controller from '@aps/next-api/controller'
import { userRepo, type User } from '../repositories/user.repo.js'

class UserController extends Controller<User> {
  readonly repository = userRepo
  readonly prefix = 'users'

  protected override registered(): void {
    super.registered()
  }
}

export default UserController
