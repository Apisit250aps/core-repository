import Controller from '@aps/next-api-core/controller'
import { userRepo, type User } from '../repositories/user.repo'
import type { Context } from 'hono'
import type { ApiResponse } from '@aps/next-api-types'

class UserController extends Controller<User> {
  readonly repository = userRepo
  readonly prefix = 'users'

  protected registered(): void {
    super.registered()
    this.app.get('/users/me', (c) => this.getMe(c))
  }

  private async getMe(c: Context): Promise<Response> {
    try {
      const users = await this.repository.findAll({})
      const user = users[0] ?? null

      if (!user) {
        return c.json<ApiResponse<null>>(
          {
            success: false,
            message: 'Not found',
            data: null,
            error: 'Not found',
          },
          404,
        )
      }

      return c.json<ApiResponse<User>>({
        success: true,
        message: 'Fetched successfully',
        data: user,
      })
    } catch (error) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          message: 'Failed to fetch user',
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      )
    }
  }
}

export default UserController
