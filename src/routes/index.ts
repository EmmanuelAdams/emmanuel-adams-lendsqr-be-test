import { Router } from 'express';
import { healthRouter } from '../domain/health/health.route';
import { userRouter } from '../domain/user/user.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/users', userRouter);

export const apiRouter = router;
