/**
 * API configuration for the application
 * 
 * IMPORTANT FOR PRODUCTION DEPLOYMENT:
 * Set the NEXT_PUBLIC_API_URL environment variable to your backend URL
 * 
 * For local development: http://localhost:3005
 * For production: https://2025-pitlane-back.vercel.app
 * 
 * Without this, the voting system will fail to load in production!
 */

import { getApiBaseUrl, validateEnvironment } from '@/lib/utils/environmentCheck';

export const API_BASE_URL = getApiBaseUrl();

// Validate environment on import (only in browser)
if (typeof window !== 'undefined') {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.error('🚨 Environment validation failed:', validation.errors);
  }
}
