import type {
  Collection,
  MongoClient,
  IndexDescription,
  Filter,
  OptionalUnlessRequiredId,
  UpdateFilter,
  FindOptions,
  Abortable,
} from 'mongodb'

import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import type { Entity, CreateInput, UpdateInput } from '@aps/next-api-types'

export const BaseEntitySchema = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) => {
  return z.object({
    id: z.uuid().default(() => uuidv7()),
    ...schema.shape,
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  })
}

type RepositoryOptions<T extends Entity> = {
  collectionName: string
  schema: z.ZodType<T>
  indexes?: IndexDescription[]
}

abstract class Repository<T extends Entity> {
  readonly collectionName: string
  readonly schema: z.ZodType<T>
  readonly indexes: IndexDescription[]
  collection: Collection<T>
  private readyPromise: Promise<void>

  protected client: MongoClient

  constructor(client: MongoClient, options: RepositoryOptions<T>) {
    this.client = client
    this.collectionName = options.collectionName
    this.schema = options.schema
    this.indexes = options.indexes ?? []
    this.collection = this.client.db().collection<T>(this.collectionName)
    this.readyPromise = this.setup()
  }

  private async setup() {
    await this.client.connect()
    await this.collection.createIndexes([
      { key: { id: 1 }, unique: true },
      ...this.indexes,
    ])
  }

  private async getCollection(): Promise<Collection<T>> {
    await this.readyPromise
    return this.collection
  }

  public async safeValidate(item: unknown) {
    return await this.schema.safeParseAsync(item)
  }

  public async validate(item: unknown): Promise<T> {
    try {
      return await this.schema.parseAsync(item)
    } catch (error) {
      throw new Error(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  public async create(item: CreateInput<T>): Promise<T> {
    const collection = await this.getCollection()
    const data = await this.validate(item)

    const insertResult = await collection.insertOne(
      data as OptionalUnlessRequiredId<T>,
    )

    if (!insertResult.acknowledged) {
      throw new Error('Failed to insert document into database')
    }

    return data as T
  }

  public async findById(id: string): Promise<T | null> {
    const collection = await this.getCollection()
    try {
      const document = await collection.findOne(
        {
          id,
        } as unknown as Filter<T>,
        { projection: { _id: 0 } },
      )
      return document as T | null
    } catch (error) {
      throw new Error(
        `Failed to find document by id: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  public async findAll(
    filters: Filter<T>,
    options?: FindOptions & Abortable,
  ): Promise<T[]> {
    const collection = await this.getCollection()
    try {
      const documents = await collection
        .find(
          {
            ...filters,
          },
          {
            projection: { _id: 0 },
            ...options,
          },
        )
        .toArray()
      return documents as T[]
    } catch (error) {
      throw new Error(
        `Failed to fetch all documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  public async update(id: string, item: UpdateInput<T>): Promise<T> {
    const collection = await this.getCollection()
    const now = new Date()
    const dataToUpdate = {
      ...item,
      updatedAt: now,
    }

    const updateResult = await collection.findOneAndUpdate(
      { id } as unknown as Filter<T>,
      { $set: dataToUpdate } as UpdateFilter<T>,
      { returnDocument: 'after', projection: { _id: 0 } },
    )

    if (!updateResult || !updateResult.value) {
      throw new Error(`Document with id ${id} not found`)
    }

    return updateResult.value as T
  }

  public async delete(id: string): Promise<void> {
    const collection = await this.getCollection()
    const deleteResult = await collection.deleteOne({
      id,
    } as unknown as Filter<T>)

    if (deleteResult.deletedCount === 0) {
      throw new Error(`Document with id ${id} not found`)
    }
  }

  public async aggregate(
    ...args: Parameters<Collection<T>['aggregate']>
  ): Promise<ReturnType<Collection<T>['aggregate']>> {
    const collection = await this.getCollection()
    return collection.aggregate(...args)
  }
}

export default Repository
