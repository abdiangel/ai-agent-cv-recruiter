import { Router } from "express";
import { HRController } from "../controllers";
import { validate, sanitizeInput } from "../middleware/validation";

const router = Router();
const hrController = new HRController();

/**
 * @route   GET /api/hr/candidates
 * @desc    Get list of candidates with filtering and pagination
 * @access  HR
 * @query   page?, limit?, status?, sortBy?, sortOrder?, search?, skills?, minExperience?, maxExperience?
 */
router.get("/candidates", validate("candidateList"), hrController.getCandidates.bind(hrController));

/**
 * @route   GET /api/hr/reports/:candidateId
 * @desc    Get detailed report for a specific candidate
 * @access  HR
 * @params  candidateId - Candidate identifier
 */
router.get("/reports/:candidateId", validate("candidateId"), hrController.getCandidateReport.bind(hrController));

/**
 * @route   PUT /api/hr/candidates/:candidateId/status
 * @desc    Update candidate status
 * @access  HR
 * @params  candidateId - Candidate identifier
 * @body    { status: string }
 */
router.put(
  "/candidates/:candidateId/status",
  sanitizeInput,
  validate("candidateId"),
  // TODO: Add validation for status update body
  hrController.updateCandidateStatus,
);

/**
 * @route   GET /api/hr/analytics
 * @desc    Get HR analytics and statistics
 * @access  HR
 */
router.get("/analytics", hrController.getAnalytics.bind(hrController));

/**
 * @route   GET /api/hr/export/candidates
 * @desc    Export candidates data in CSV format
 * @access  HR
 */
router.get("/export/candidates", hrController.exportCandidates.bind(hrController));

export default router;
