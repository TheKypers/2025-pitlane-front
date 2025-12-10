"use client";

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if password is compromised using HaveIBeenPwned Pwned Passwords API
 * Uses k-Anonymity model - only sends first 5 characters of SHA-1 hash for privacy
 * 
 * How it works:
 * 1. Creates SHA-1 hash of the password
 * 2. Sends only first 5 characters to API (preserves privacy)
 * 3. API returns all hash suffixes that start with those 5 characters
 * 4. We check if our password's hash suffix appears in the response
 * 
 * This method ensures the actual password never leaves the client
 * and provides strong privacy protection while checking against
 * hundreds of millions of known compromised passwords.
 */
export async function checkPasswordBreach(password: string): Promise<{
  isBreached: boolean;
  error?: string;
}> {
  try {
    // Create SHA-1 hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Use k-Anonymity: send only first 5 characters of hash
    const hashPrefix = hashHex.substring(0, 5);
    const hashSuffix = hashHex.substring(5);
    
    // Query HaveIBeenPwned Pwned Passwords API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseText = await response.text();
    
    const hashLines = responseText.split('\n');
    const isBreached = hashLines.some(line => {
      const [suffix] = line.split(':');
      return suffix === hashSuffix;
    });

    if (isBreached) {
      return {
        isBreached: true,
        error: "This password has been found in data breaches and is not secure. Please choose a different password."
      };
    }

    return {
      isBreached: false
    };

  } catch (error) {
    console.error('Error checking password breach:', error);
    return {
      isBreached: false,
      error: "Unable to verify password security at this time. Please ensure your password meets all requirements."
    };
  }
}

/**
 * Comprehensive password validation including breach check
 */
export async function validatePasswordWithBreachCheck(password: string): Promise<{
  isValid: boolean;
  errors: string[];
  isBreached?: boolean;
}> {
  // First check basic requirements
  const basicValidation = validatePassword(password);
  
  if (!basicValidation.isValid) {
    return {
      isValid: false,
      errors: basicValidation.errors
    };
  }

  // Then check for breaches
  const breachCheck = await checkPasswordBreach(password);
  
  if (breachCheck.isBreached) {
    return {
      isValid: false,
      errors: [breachCheck.error || "Password has been compromised"],
      isBreached: true
    };
  }

  return {
    isValid: true,
    errors: [],
    isBreached: false
  };
}