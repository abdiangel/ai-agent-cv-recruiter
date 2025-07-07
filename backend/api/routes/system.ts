import { Router } from "express";
import { SystemController } from "../controllers";

const router = Router();
const systemController = new SystemController();

/**
 * @route   GET /api/system/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", systemController.healthCheck.bind(systemController));

/**
 * @route   GET /api/system/stats
 * @desc    System statistics endpoint
 * @access  Admin
 */
router.get(
  "/stats",
  // TODO: Add authentication middleware for admin endpoints
  systemController.getStats.bind(systemController),
);

/**
 * @route   GET /api/system/info
 * @desc    System information endpoint
 * @access  Admin
 */
router.get(
  "/info",
  // TODO: Add authentication middleware for admin endpoints
  systemController.getSystemInfo.bind(systemController),
);

export default router;
