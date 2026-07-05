import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { PrismaAuthRepository } from "./modules/auth/repositories/prismaAuthRepository.js";

const authRepository = new PrismaAuthRepository(prisma);
const authService = new AuthService(authRepository, {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: "7d"
});

const app = createApp({
  authRouter: createAuthRouter(authService)
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
