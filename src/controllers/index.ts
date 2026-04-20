import type { Post } from '@/entities'
import { postRepo } from '@/repositories'
import Controller from '@aps/next-api/controller'

class PostController extends Controller<Post> {
  group = 'api'
  prefix = 'posts'
  repository = postRepo
}

export const postController = new PostController()
