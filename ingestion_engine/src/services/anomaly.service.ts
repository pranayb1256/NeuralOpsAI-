// src/services/anomaly.service.ts
import { redisClient } from '../infrastructure/redis/client';
import { randomUUID } from 'crypto';

export class AnomalyService {
  // Configuration: Alert if we see 10 errors within 60 seconds
  private static ALERT_THRESHOLD = 10;
  private static WINDOW_SIZE_SEC = 60;

  /**
   * Evaluates if an incoming error log breaches our statistical threshold
   */
  static async evaluateErrorRate(serviceId: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - (this.WINDOW_SIZE_SEC * 1000);
    
    // Each service gets its own unique tracking key
    const redisKey = `neuralops:sliding_window:${serviceId}`;

    // Redis Pipeline allows us to execute multiple commands in one network round-trip
    const multi = redisClient.multi();

    // 1. Remove logs older than 60 seconds
    multi.zRemRangeByScore(redisKey, 0, windowStart);

    // 2. Add the current log (score = timestamp, value = unique ID to prevent overwriting)
    multi.zAdd(redisKey, [{ score: now, value: `${now}-${randomUUID()}` }]);

    // 3. Count how many logs are currently in the 60-second window
    multi.zCard(redisKey);

    // 4. Set an expiry on the key so we don't leak memory if the service stops sending logs
    multi.expire(redisKey, this.WINDOW_SIZE_SEC * 2);

    // Execute the transaction
    const results = await multi.exec();
    
    // results[2] is the output of our zCard (count) command
    const currentErrorCount = results[2] as unknown as number;

    console.log(`📊 Service ${serviceId} Error Rate: ${currentErrorCount}/${this.ALERT_THRESHOLD}`);

    if (currentErrorCount >= this.ALERT_THRESHOLD) {
      return true; // Threshold breached! Trigger the AI.
    }

    return false;
  }
}