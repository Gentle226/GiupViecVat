import crypto from "crypto";

/**
 * Generate a random password for OAuth users
 */
export const generateRandomPassword = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate a secure random string
 */
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};
