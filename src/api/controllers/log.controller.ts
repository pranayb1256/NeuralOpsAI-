import {Request, Response} from 'express';
import {IngestionService} from '../../services/ingestion.service';
import { catchAsync } from '../../utils/catchAsync';
import { AuthenticatedRequest } from '../middlewares/requireAuth'

export class LogController {
    static ingest = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
        const { serviceId, level, message, metadata } = req.body;

        const eventId = await IngestionService.queueLog(serviceId, level, message, metadata);

        res.status(201).json({ eventId });
    });
}