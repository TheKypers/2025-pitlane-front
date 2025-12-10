/**
 * Environment detection and validation utilities
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
  
  // In production, warn if still using localhost
  if (isProduction() && apiUrl.includes('localhost')) {
    console.error('🚨 PRODUCTION ERROR: API URL is still pointing to localhost!');
    console.error('Set NEXT_PUBLIC_API_URL environment variable to your production backend URL');
    console.error('Expected: https://2025-pitlane-back.vercel.app');
    console.error('Current:', apiUrl);
  }
  
  return apiUrl;
}

export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (isProduction()) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      errors.push('NEXT_PUBLIC_API_URL environment variable is not set');
    } else if (apiUrl.includes('localhost')) {
      errors.push('NEXT_PUBLIC_API_URL is pointing to localhost in production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}