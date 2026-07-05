import multer from "multer";
import { Router } from "express";
import { imageUploadRules } from "@accounting-app/shared";
import { createAuthMiddleware, type AuthenticatedRequest } from "../../middlewares/authMiddleware.js";
import type { AuthService } from "../auth/auth.service.js";
import type { ImageStorage } from "./imageStorage.js";
import { AppError } from "../../errors/AppError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: imageUploadRules.maxBytes,
    files: imageUploadRules.maxFiles
  }
});

export function createUploadsRouter(authService: AuthService, imageStorage: ImageStorage) {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  router.post(
    "/uploads/bill-image",
    requireAuth,
    upload.single("image"),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        if (!request.file) {
          throw new AppError("Image file is required", 400);
        }

        const imageUrl = await imageStorage.saveBillImage(request.file);
        response.status(201).json({ ok: true, data: { imageUrl } });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
