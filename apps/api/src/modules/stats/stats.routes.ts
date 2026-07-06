import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../errors/AppError.js";
import {
  createAuthMiddleware,
  type AuthenticatedRequest,
} from "../../middlewares/authMiddleware.js";
import type { AuthService } from "../auth/auth.service.js";
import type { StatsService } from "./stats.service.js";

const typeSchema = z.enum(["expense", "income"]);

export function createStatsRouter(
  authService: AuthService,
  statsService: StatsService,
) {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  router.get(
    "/stats/monthly",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const bookId = parseRequiredQuery(request.query.bookId, "bookId");
        const month = parseRequiredQuery(request.query.month, "month");
        const stats = await statsService.getMonthlyStats({
          userId: request.currentUser!.id,
          bookId,
          month,
        });

        response.json({ ok: true, data: { stats } });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/stats/categories",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const bookId = parseRequiredQuery(request.query.bookId, "bookId");
        const month = parseRequiredQuery(request.query.month, "month");
        const type = typeSchema.parse(request.query.type);
        const categories = await statsService.getCategoryStats({
          userId: request.currentUser!.id,
          bookId,
          month,
          type,
        });

        response.json({ ok: true, data: { categories } });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

function parseRequiredQuery(value: unknown, name: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${name} is required`, 400);
  }

  return value.trim();
}
