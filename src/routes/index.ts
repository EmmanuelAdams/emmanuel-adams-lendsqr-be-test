import { Router } from 'express';
import { healthRouter } from '../domain/health/health.route';

const router = Router();

router.use('/health', healthRouter);

export const apiRouter = router;
