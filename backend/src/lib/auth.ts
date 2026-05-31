import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import type { AuthTokenPayload } from "../types/auth.js";

const ACCESS_TOKEN_EXPIRY_SECONDS = env.ACCESS_TOKEN_TTL_MINUTES * 60;
const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60;
const ACCESS_TOKEN_OPTIONS: jwt.SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS };
const REFRESH_TOKEN_OPTIONS: jwt.SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS };

export const hashPassword = async (rawPassword: string): Promise<string> =>
  bcrypt.hash(rawPassword, 12);

export const verifyPassword = async (
  rawPassword: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(rawPassword, passwordHash);

export const signAccessToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, ACCESS_TOKEN_OPTIONS);

export const signRefreshToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, REFRESH_TOKEN_OPTIONS);

export const verifyAccessToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;

export const hashOpaqueToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
