import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { PrismaAuthRepository } from "./modules/auth/repositories/prismaAuthRepository.js";
import { createBooksRouter } from "./modules/books/books.routes.js";
import { BooksService } from "./modules/books/books.service.js";
import { PrismaBookRepository } from "./modules/books/repositories/prismaBookRepository.js";

const authRepository = new PrismaAuthRepository(prisma);
const authService = new AuthService(authRepository, {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: "7d"
});
const bookRepository = new PrismaBookRepository(prisma);
const booksService = new BooksService(bookRepository);

const app = createApp({
  authRouter: createAuthRouter(authService),
  booksRouter: createBooksRouter(authService, booksService)
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
