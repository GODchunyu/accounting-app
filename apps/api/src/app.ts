import cors from "cors";
import express, { type Router } from "express";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

export interface AppDependencies {
  authRouter?: Router;
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "accounting-api" });
  });

  if (dependencies.authRouter) {
    app.use("/api", dependencies.authRouter);
  }

  app.use(errorMiddleware);

  return app;
}
