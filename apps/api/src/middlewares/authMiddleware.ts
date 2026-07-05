import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import type { AuthService } from "../modules/auth/auth.service.js";
import type { PublicUser } from "../modules/auth/auth.types.js";

export interface AuthenticatedRequest extends Request {
  currentUser?: PublicUser;
}

export function createAuthMiddleware(authService: AuthService) {
  return async (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    const authorization = request.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      next(new AppError("请先登录", 401));
      return;
    }

    const token = authorization.slice("Bearer ".length);

    try {
      request.currentUser = await authService.getUserFromToken(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
