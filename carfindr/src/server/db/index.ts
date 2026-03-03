import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";
import { createClient } from 'redis';
import { logger } from "@/lib/logger";

/**
 * Cache the database and Redis connections in development. This avoids creating new connections on every HMR update.
 */
const globalForConnections = globalThis as unknown as {
  postgresConn: postgres.Sql | undefined;
  redisClient: ReturnType<typeof createClient> | undefined;
};

// Postgres connection
const postgresConn = globalForConnections.postgresConn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForConnections.postgresConn = postgresConn;
export const db = drizzle(postgresConn, { schema });

// Redis connection
const createRedisClient = () => {
  const client = createClient({
    url: env.REDIS_URL 
  });
  
  client.on('error', (err) => logger.error('Redis Client Error', err));
  
  return client;
};

const redisClient = globalForConnections.redisClient ?? createRedisClient();
if (env.NODE_ENV !== "production") globalForConnections.redisClient = redisClient;

export const getRedisClient = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};
