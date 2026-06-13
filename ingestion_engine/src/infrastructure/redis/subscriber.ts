// src/infrastructure/redis/subscriber.ts
import { redisClient } from './client';
import { WebSocketService } from '../websocket/socket';

// Create a dedicated client for Pub/Sub
const redisSubscriber = redisClient.duplicate();

export const initializeSubscriber = async () => {
  await redisSubscriber.connect();
  console.log('📡 Redis Pub/Sub Subscriber connected.');

  // Subscribe to the AI alerts channel
  await redisSubscriber.subscribe('neuralops:alerts', (message) => {
    try {
      const payload = JSON.parse(message);
      
      console.log(`⚡ Received real-time alert for Service: ${payload.service_id}`);
      
      // Forward the AI report to the specific WebSocket room
      WebSocketService.broadcastToService(payload.service_id, 'incident_resolved', payload);
      
    } catch (error) {
      console.error('Failed to process incoming Redis Pub/Sub message', error);
    }
  });
};