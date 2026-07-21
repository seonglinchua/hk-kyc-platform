import express from 'express';
import {
  getCases,
  createCase,
  getCaseById,
  updateCase,
  deleteCase,
  updateCaseStatus,
  getCaseSummary,
  triggerAnalysis
} from '../controllers/caseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All case routes require authentication
router.use(authenticate);

// Case CRUD
router.get('/', getCases);
router.post('/', createCase);
router.get('/:id', getCaseById);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);

// Case status
router.patch('/:id/status', updateCaseStatus);

// AI Summary
router.get('/:id/summary', getCaseSummary);
router.post('/:id/trigger-analysis', triggerAnalysis);

export default router;
