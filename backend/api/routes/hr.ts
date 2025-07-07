import { Router, RequestHandler } from "express";
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
router.get("/candidates", validate("candidateList") as RequestHandler, hrController.getCandidates.bind(hrController) as RequestHandler);

/**
 * @route   GET /api/hr/reports/:candidateId
 * @desc    Get detailed report for a specific candidate
 * @access  HR
 * @params  candidateId - Candidate identifier
 */
router.get("/reports/:candidateId", validate("candidateId") as RequestHandler, hrController.getCandidateReport.bind(hrController) as RequestHandler);

/**
 * @route   PUT /api/hr/candidates/:candidateId/status
 * @desc    Update candidate status
 * @access  HR
 * @params  candidateId - Candidate identifier
 * @body    { status: string }
 */
router.put(
  "/candidates/:candidateId/status",
  sanitizeInput as RequestHandler,
  validate("candidateId") as RequestHandler,
  // TODO: Add validation for status update body
  hrController.updateCandidateStatus as RequestHandler,
);

/**
 * @route   GET /api/hr/analytics
 * @desc    Get HR analytics and statistics
 * @access  HR
 */
router.get("/analytics", hrController.getAnalytics.bind(hrController) as RequestHandler);

/**
 * @route   GET /api/hr/export/candidates
 * @desc    Export candidates data in CSV format
 * @access  HR
 */
router.get("/export/candidates", hrController.exportCandidates.bind(hrController) as RequestHandler);

export default router;
