import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  void next;

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      ok: false,
      error: {
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      ok: false,
      error: {
        message: "Invalid request parameters",
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      ok: false,
      error: {
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image size must be at most 5MB"
            : "Invalid upload",
      },
    });
    return;
  }

  response.status(500).json({
    ok: false,
    error: {
      message: "Internal server error",
    },
  });
};
