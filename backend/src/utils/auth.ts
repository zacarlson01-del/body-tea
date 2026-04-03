import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

function requireEnv(name: string, minLen = 32): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  if (value.length < minLen) {
    throw new Error(`Environment variable ${name} must be at least ${minLen} characters`);
  }
  return value;
}

const JWT_SECRET = requireEnv('JWT_SECRET', 32);
const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET', 32);
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  username?: string;
  iat?: number;
  exp?: number;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token generation
export function generateAccessToken(userId: string, email: string, username?: string): string {
  return jwt.sign(
    { userId, email, username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
}

export function generateTokenPair(userId: string, email: string, username?: string) {
  return {
    accessToken: generateAccessToken(userId, email, username),
    refreshToken: generateRefreshToken(userId),
  };
}

// Verify tokens
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

// Decode token without verification (for debugging)
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

// Generate account ID (ISEA-XXXX-XXXX)
export function generateAccountId(): string {
  const part1 = Math.random().toString(16).substring(2, 6).toUpperCase().padStart(4, '0');
  const part2 = Math.random().toString(16).substring(2, 6).toUpperCase().padStart(4, '0');
  return `ISEA-${part1}-${part2}`;
}
