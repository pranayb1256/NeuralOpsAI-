// src/server.ts
import http from 'http';
import app from './app';
import  prisma  from './infrastructure/database/prisma.client';
// import { redisClient } from './infrastructure/redis/client';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

async function bootstrap() {
  try {
    // Await external connections here before starting the server
    // await prisma.$connect();
    // await redisClient.connect();
    
    server.listen(PORT, () => {
      console.log(`NeuralOps API Gateway running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

// --- Graceful Shutdown Logic ---
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    // Close infrastructure connections
    await prisma.$disconnect();
    // await redisClient.quit();
    
    console.log('Graceful shutdown complete. Exiting process.');
    process.exit(0);
  });

  // Force shutdown if it takes longer than 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals from OS / Docker
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop