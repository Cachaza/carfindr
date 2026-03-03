"use server"
import { db } from "@/server/db";
import { marcas, modelos } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getRedisClient } from "@/server/db";
const redisClient = await getRedisClient();
// Helper function to get or set cache
async function getOrSetCache(key: string, cb: () => Promise<any>, expireIn: number = 3600*24) {
  
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const freshData = await cb();
  await redisClient.setEx(key, expireIn, JSON.stringify(freshData));
  return freshData;
}

export async function getModels(brandId: string) {
  if (!brandId || brandId === 'All') return [];
  
  const cacheKey = `models:${brandId}`;
  
  return getOrSetCache(cacheKey, async () => {
    const brandModels = await db.query.marcas.findFirst({
      where: eq(marcas.cochesNetId, parseInt(brandId)),
      with: {
        modelos: true,
      },
    });
    
    return brandModels?.modelos ?? [];
  });
}

export async function getBrands() {
  const cacheKey = 'all:brands';
  
  return getOrSetCache(cacheKey, async () => {
    return await db.query.marcas.findMany();
  });
}