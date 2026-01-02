import { Router } from 'express';
import {
  login,
  register,
  profile,
  refreshSession,
  logout,
  verifyOtp,
  resendOtp
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/otp/verify', verifyOtp);
router.post('/otp/resend', resendOtp);
router.post('/refresh', refreshSession);
router.post('/logout', logout);
router.get('/me', protect, profile);

export default router;
