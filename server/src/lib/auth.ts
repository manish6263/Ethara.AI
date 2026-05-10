import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "7d";

export type JwtPayload = {
  userId: string;
};

export function signToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.verify(token, secret) as JwtPayload;
}

export function cookieOptions() {
  const production = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: production ? "none" as const : "lax" as const,
    secure: production,
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}
