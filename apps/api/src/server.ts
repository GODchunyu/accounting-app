import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { PrismaAuthRepository } from "./modules/auth/repositories/prismaAuthRepository.js";
import { createBillsRouter } from "./modules/bills/bills.routes.js";
import { BillsService } from "./modules/bills/bills.service.js";
import { PrismaBillRepository } from "./modules/bills/repositories/prismaBillRepository.js";
import { createBooksRouter } from "./modules/books/books.routes.js";
import { BooksService } from "./modules/books/books.service.js";
import { PrismaBookRepository } from "./modules/books/repositories/prismaBookRepository.js";
import { createCategoriesRouter } from "./modules/categories/categories.routes.js";
import { CategoriesService } from "./modules/categories/categories.service.js";
import { PrismaCategoryRepository } from "./modules/categories/repositories/prismaCategoryRepository.js";
import { createStatsRouter } from "./modules/stats/stats.routes.js";
import { StatsService } from "./modules/stats/stats.service.js";
import { ImageStorage } from "./modules/uploads/imageStorage.js";
import { createUploadsRouter } from "./modules/uploads/uploads.routes.js";

const authRepository = new PrismaAuthRepository(prisma);
const authService = new AuthService(authRepository, {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: "7d",
});
const bookRepository = new PrismaBookRepository(prisma);
const booksService = new BooksService(bookRepository);
const categoryRepository = new PrismaCategoryRepository(prisma);
const categoriesService = new CategoriesService(categoryRepository);
const billRepository = new PrismaBillRepository(prisma);
const imageStorage = new ImageStorage(env.UPLOAD_DIR);
const billsService = new BillsService(
  billRepository,
  bookRepository,
  categoryRepository,
  imageStorage,
);
const statsService = new StatsService(
  billRepository,
  bookRepository,
  categoryRepository,
);

const app = createApp({
  authRouter: createAuthRouter(authService),
  booksRouter: createBooksRouter(authService, booksService),
  categoriesRouter: createCategoriesRouter(authService, categoriesService),
  billsRouter: createBillsRouter(authService, billsService),
  uploadsRouter: createUploadsRouter(authService, imageStorage),
  statsRouter: createStatsRouter(authService, statsService),
  uploadsDir: env.UPLOAD_DIR,
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
