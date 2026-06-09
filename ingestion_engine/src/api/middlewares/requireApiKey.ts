import {Request,Response, NextFunction} from 'express';
import prisma from '../../infrastructure/database/prisma.client';
import { CryptoUtils } from '../../utils/crypto';


export interface IngestionRequest extends Request {
    serviceId?: string;
}

export const requireApiKey = async (
    req: IngestionRequest,
    res: Response,
    next: NextFunction
): Promise<void> =>
{
    const apikey= req.header('x-api-key') as string

    if(!apikey)
    {
        return res.status(401).json({ error: 'API key is required' });
    }
    const parts= apikey.split('_'); 
    if(parts.length !== 3 || parts[0] !== 'nop' || parts[1] !== 'live')
    {
      res.status(401).json({ error: 'Invalid API key format' });
      return 
    }

    const prefix = `${parts[0]}_${parts[1]}_${parts[2]}`;
    const secretToken = parts[3];

    try {
        const service= await prisma.service.findUnique({
            where: { apiKeyPrefix: prefix },
            select: { id: true, apiKeyHash: true }
        });

        if (!service) {
             res.status(401).json({ error: 'Invalid API key' })
             return;
        }

        const incomingHash = CryptoUtils.hashSecret(secretToken);
    
    // In strict production setups, use crypto.timingSafeEqual to prevent side-channel timing attacks
    if (incomingHash !== service.apiKeyHash) {
      res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
      return;
    }
    // 5. Inject service context into the request object
    req.serviceId = service.id;
    next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        return
    }
}