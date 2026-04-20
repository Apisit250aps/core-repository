import Repository from '@aps/next-api/repository'

import { PostEntity, type Post } from '@/entities'
import type { IndexDescription } from 'mongodb'
import client from '@/client'

class PostRepository extends Repository<Post> {
  collectionName = 'posts'
  schema = PostEntity
  indexes: IndexDescription[] = [{ key: { title: 1 } }, { key: { author: 1 } }]
}

export const postRepo = new PostRepository(client)
