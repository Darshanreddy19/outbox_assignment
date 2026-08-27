import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config";
import { prisma } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

router.get("/google", (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account consent",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    redirect_uri: config.google.redirectUri,
  });
  res.json({ url });
});

router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing code parameter" });
  }

  try {
    const { tokens } = await googleClient.getToken({
      code: code as string,
      redirect_uri: config.google.redirectUri,
    });

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload()!;
    const { sub: googleId, email, name, picture } = payload;

    const user = await prisma.user.upsert({
      where: { email: email! },
      update: { name: name || undefined, avatar: picture || undefined },
      create: {
        id: googleId!,
        email: email!,
        name: name || null,
        avatar: picture || null,
      },
    });

    const frontendUrl = `${config.frontendUrl}/dashboard?token=${tokens.id_token}`;
    res.redirect(frontendUrl);
  } catch (err: any) {
    console.error("OAuth callback error:", err.message);
    res.status(500).json({ error: "Authentication failed" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, avatar: true },
  });
  res.json(user);
});

export default router;
