import cors from "cors";
import express, { type Router } from "express";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

export interface AppDependencies {
  authRouter?: Router;
  booksRouter?: Router;
  categoriesRouter?: Router;
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

  if (dependencies.booksRouter) {
    app.use("/api", dependencies.booksRouter);
  }

  if (dependencies.categoriesRouter) {
    app.use("/api", dependencies.categoriesRouter);
  }

  app.use(errorMiddleware);

  return app;
}
