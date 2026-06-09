import {Router} from 'express'
import { AuthController } from '../controllers/auth.controller'
import { LogController } from '../controllers/log.controller';
import { requireAuth } from '../middlewares/requireAuth'; // or requireApiKey if using API keys

const router = Router()

router.post('/register',AuthController.register)
router.post('/login',AuthController.login)
router.post('/ingest', requireAuth, LogController.ingest);

export default router