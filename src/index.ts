import { serve } from '@hono/node-server'
import app from '@/app'
import { userRepo } from '@/repositories/user.repo'
userRepo.create({
  name: 'John Doe a',
  email: 'john.doe@examples.com',
  password: 'password123',
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
