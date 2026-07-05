import { Router } from 'express';
import { healthRouter } from '../domain/health/route/health.route';
import { authRouter } from '../domain/auth/route/auth.route';
import { walletRouter } from '../domain/wallet/route/wallet.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/wallet', walletRouter);

export const apiRouter = router;
