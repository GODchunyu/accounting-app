import { Router } from "express";
import { z } from "zod";
import { createAuthMiddleware, type AuthenticatedRequest } from "../../middlewares/authMiddleware.js";
import type { AuthService } from "./auth.service.js";

const credentialsSchema = z.object({
  username: z.string(),
  password: z.string()
});

export function createAuthRouter(authService: AuthService) {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  router.post("/auth/register", async (request, response, next) => {
    try {
      const body = credentialsSchema.parse(request.body);
      const result = await authService.register(body);

      response.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/auth/login", async (request, response, next) => {
    try {
      const body = credentialsSchema.parse(request.body);
      const result = await authService.login(body);

      response.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.get("/users/me", requireAuth, (request: AuthenticatedRequest, response) => {
    response.json({ ok: true, data: { user: request.currentUser } });
  });

  return router;
}
