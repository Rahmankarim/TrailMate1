import { MongoClient, type Db, type Document } from "mongodb"

const options = {}

let clientPromise: Promise<MongoClient> | undefined

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function getMongoClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  if (process.env.NODE_ENV === "development") {
    // In development, preserve the client promise across hot reloads.
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    // In production, create one client promise per process.
    const client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  return clientPromise
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClientPromise()
  return client.db()
}

export async function getCollection<T extends Document>(collectionName: string) {
  const db = await getDatabase()
  return db.collection<T>(collectionName)
}

export default getMongoClientPromise
