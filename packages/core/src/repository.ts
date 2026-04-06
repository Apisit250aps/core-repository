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

abstract class Repository<T extends Entity> {
  abstract readonly collectionName: string

  abstract readonly schema: z.ZodType<T>
  abstract readonly indexes: IndexDescription[]
  abstract collection: Collection<T>

  protected client: MongoClient

  constructor(client: MongoClient) {
    this.client = client
    this.setCollection().catch((error) => {
      console.error(
        `Error setting collection for ${this.collectionName}:`,
        error,
      )
    })
  }

  private async setCollection() {
    this.collection = this.client.db().collection<T>(this.collectionName)
    await this.collection.createIndexes([
      { key: { id: 1 }, unique: true },
      ...this.indexes,
    ])
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
    const data = await this.validate(item)

    const insertResult = await this.collection.insertOne(
      data as OptionalUnlessRequiredId<T>,
    )

    if (!insertResult.acknowledged) {
      throw new Error('Failed to insert document into database')
    }

    return data as T
  }

  public async findById(id: string): Promise<T | null> {
    try {
      const document = await this.collection.findOne(
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
    try {
      const documents = await this.collection
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
    const now = new Date()
    const dataToUpdate = {
      ...item,
      updatedAt: now,
    }

    const updateResult = await this.collection.findOneAndUpdate(
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
    const deleteResult = await this.collection.deleteOne({
      id,
    } as unknown as Filter<T>)

    if (deleteResult.deletedCount === 0) {
      throw new Error(`Document with id ${id} not found`)
    }
  }

  public async aggregate(
    ...args: Parameters<Collection<T>['aggregate']>
  ): Promise<ReturnType<Collection<T>['aggregate']>> {
    return this.collection.aggregate(...args)
  }
}

export default Repository
