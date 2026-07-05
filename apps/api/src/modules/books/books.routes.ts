import { Router } from "express";
import { z } from "zod";
import { createAuthMiddleware, type AuthenticatedRequest } from "../../middlewares/authMiddleware.js";
import type { AuthService } from "../auth/auth.service.js";
import type { BooksService } from "./books.service.js";

const bookBodySchema = z.object({
  name: z.string()
});

export function createBooksRouter(authService: AuthService, booksService: BooksService) {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  router.get("/books", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const books = await booksService.listBooks(request.currentUser!.id);
      response.json({ ok: true, data: { books } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/books", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const body = bookBodySchema.parse(request.body);
      const book = await booksService.createBook({
        userId: request.currentUser!.id,
        name: body.name
      });

      response.status(201).json({ ok: true, data: { book } });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/books/:id", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const body = bookBodySchema.parse(request.body);
      const book = await booksService.renameBook({
        userId: request.currentUser!.id,
        bookId: request.params.id,
        name: body.name
      });

      response.json({ ok: true, data: { book } });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/books/:id", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      await booksService.deleteBook(request.currentUser!.id, request.params.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
