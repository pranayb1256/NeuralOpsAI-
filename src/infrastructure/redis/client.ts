import {createClient} from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect().then(() => {
  console.log('Connected to Redis');
}).catch((err) => {
  console.error('Failed to connect to Redis', err);
});
redisClient.on('reconnecting', () => {
  console.log('Redis connection closed');
});

export const connectRedis = async ()=>
{
    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
            console.log('Connected to Redis');
        } catch (err) {
            console.error('Failed to connect to Redis', err);
        }       
    }
}