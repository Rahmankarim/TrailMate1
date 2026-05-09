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

  const createAndConnect = async () => {
    try {
      const client = new MongoClient(uri, options)
      return client.connect()
    } catch (err: any) {
      console.error("Failed to connect to MongoDB:", err && err.message ? err.message : err)
      console.error("MongoDB URI:", uri && uri.length > 60 ? `${uri.slice(0, 60)}...` : uri)
      console.error(
        "If you're using MongoDB Atlas (mongodb+srv://), ensure your network allows DNS SRV lookups and your current IP is allow-listed in Atlas Network Access.\n" +
          "For local development, you can switch to a local MongoDB instance by setting MONGODB_URI=mongodb://127.0.0.1:27017/trailmate in your .env.local."
      )
      throw err
    }
  }

  if (process.env.NODE_ENV === "development") {
    // In development, preserve the client promise across hot reloads.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createAndConnect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    // In production, create one client promise per process.
    clientPromise = createAndConnect()
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
