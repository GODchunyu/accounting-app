import cors from "cors";
import express, { type Router } from "express";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

export interface AppDependencies {
  authRouter?: Router;
  booksRouter?: Router;
  categoriesRouter?: Router;
  billsRouter?: Router;
  uploadsRouter?: Router;
  statsRouter?: Router;
  uploadsDir?: string;
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "accounting-api" });
  });

  if (dependencies.uploadsDir) {
    app.use("/uploads", express.static(dependencies.uploadsDir));
  }

  if (dependencies.authRouter) {
    app.use("/api", dependencies.authRouter);
  }

  if (dependencies.booksRouter) {
    app.use("/api", dependencies.booksRouter);
  }

  if (dependencies.categoriesRouter) {
    app.use("/api", dependencies.categoriesRouter);
  }

  if (dependencies.billsRouter) {
    app.use("/api", dependencies.billsRouter);
  }

  if (dependencies.uploadsRouter) {
    app.use("/api", dependencies.uploadsRouter);
  }

  if (dependencies.statsRouter) {
    app.use("/api", dependencies.statsRouter);
  }

  app.use(errorMiddleware);

  return app;
}
