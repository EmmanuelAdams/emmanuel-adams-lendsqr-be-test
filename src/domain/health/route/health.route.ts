import { Router } from 'express';
import { HealthController } from '../controller/health.controller';

const router = Router();
const controller = new HealthController();

router.get('/', controller.check);

export const healthRouter = router;
