import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      ok: false,
      error: {
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      ok: false,
      error: {
        message: "请求参数不正确"
      }
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected error";

  response.status(500).json({
    ok: false,
    error: {
      message
    }
  });
};
