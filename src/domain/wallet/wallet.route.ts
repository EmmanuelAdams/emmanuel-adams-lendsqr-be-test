import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { WalletController } from './wallet.controller';

const router = Router();
const controller = new WalletController();

router.get('/', authenticate, controller.getBalance);

export const walletRouter = router;
