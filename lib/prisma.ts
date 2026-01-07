import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

neonConfig.fetchConnectionCache = true

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prismaInstance) return prismaInstance
  
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  const adapter = new PrismaNeon({ connectionString })
  prismaInstance = new PrismaClient({ adapter })
  
  return prismaInstance
}

// For backward compatibility - proxy delays initialization until first use
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return getPrisma()[prop as keyof PrismaClient]
  }
})
