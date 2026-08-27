import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config";
import { prisma } from "../db";

const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const { sub: googleId, email, name, picture } = payload;

    const user = await prisma.user.upsert({
      where: { email: email! },
      update: {
        name: name || undefined,
        avatar: picture || undefined,
      },
      create: {
        id: googleId!,
        email: email!,
        name: name || null,
        avatar: picture || null,
      },
    });

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err: any) {
    console.error("Auth failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
