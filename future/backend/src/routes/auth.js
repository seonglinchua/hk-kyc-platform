import express from 'express';
import { login, register, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

// Private routes
router.get('/me', authenticate, getCurrentUser);

export default router;
