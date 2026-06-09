import {redisClient} from '../infrastructure/redis/client';
import {randomUUID} from 'crypto';

const LOG_QUEUE = 'log_queue';

export class IngestionService {
    static async queueLog(serviceId:string, level:string, message:string,metadata:any={}){
    
        const logPayload = {
            eventId: randomUUID(),
            serviceId,
            level:level.toUpperCase(),
            message,
            metadata,
            ingestedAt: new Date().toISOString()
        }
        const payloadString = JSON.stringify(logPayload);

        await redisClient.rPush(LOG_QUEUE, payloadString);

        return logPayload.eventId;
    }

}