import {redisClient} from '../infrastructure/redis/client';
import {randomUUID} from 'crypto';
import { AnomalyService } from './anomaly.service';
const LOG_QUEUE = 'neuralops:log_queue';
const INCIDENT_QUEUE='neuralops:incidents:queue'
export class IngestionService {
    static async queueLog(serviceId:string, level:string, message:string,metadata:any={}){
        const eventId=randomUUID()
        const normalizedLevel = level.toUpperCase()

        const logPayload = {
            eventId: randomUUID(),
            serviceId,
            level:level.toUpperCase(),
            message,
            metadata,
            ingestedAt: new Date().toISOString()
        }
        await redisClient.rPush(LOG_QUEUE, JSON.stringify(logPayload));

    // 2. The Production Best Practice: Tier 1 Statistical Filtering
    if (normalizedLevel === 'ERROR' || normalizedLevel === 'FATAL') {
      const isAnomaly = await AnomalyService.evaluateErrorRate(serviceId);
      
      if (isAnomaly) {
        console.log(`🚨 ANOMALY DETECTED for ${serviceId}! Waking up AI Agents...`);
        
        // Push a trigger payload to the Incident Queue
        const incidentTrigger = {
          serviceId,
          triggerEventId: eventId,
          timestamp: Date.now(),
          reason: `Statistical threshold exceeded: 10 errors in 60s`
        };
        
        await redisClient.rPush(INCIDENT_QUEUE, JSON.stringify(incidentTrigger));
        
        // Optional: We can set a Redis flag here to "debounce" and prevent 
        // triggering 50 AI agents for the same ongoing incident.
      }
    }

    return eventId;
    }

}