import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "accounting-api" });
  });

  app.use(errorMiddleware);

  return app;
}
