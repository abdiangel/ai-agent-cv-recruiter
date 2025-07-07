#!/usr/bin/env node

/**
 * Start the AI Recruitment Agent API Server
 */
import { startServer } from "../server";

async function start() {
  try {
    console.log("🚀 Starting AI Recruitment Agent API Server...");
    await startServer();
    console.log("✅ Server started successfully!");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
