import { Router } from 'express';
import { healthRouter } from '../domain/health/health.route';
import { authRouter } from '../domain/auth/auth.route';
import { walletRouter } from '../domain/wallet/wallet.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/wallet', walletRouter);

export const apiRouter = router;
