import {Router} from 'express'
import { SearchController } from '../controllers/search.controller'
import { requireAuth } from '../middlewares/requireAuth'; // or requireApiKey if using API keys

const router = Router()
router.post('/query', requireAuth, SearchController.query)

export default router