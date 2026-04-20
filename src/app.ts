import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { postController } from './controllers'
const app = new Hono()

app.use('*', logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/api', postController.routes())

export default app
