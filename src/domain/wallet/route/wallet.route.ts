import { Router } from 'express';
import { authenticate } from '../../../common/middleware/auth.middleware';
import { financialRateLimiter } from '../../../common/middleware/rate-limit.middleware';
import { WalletController } from '../controller/wallet.controller';

const router = Router();
const controller = new WalletController();

router.get('/', authenticate, controller.getBalance);
router.post('/fund', authenticate, financialRateLimiter, controller.fund);
router.post('/transfer', authenticate, financialRateLimiter, controller.transfer);

export const walletRouter = router;
