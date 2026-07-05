import { Router } from "express";
import { z } from "zod";
import { createAuthMiddleware, type AuthenticatedRequest } from "../../middlewares/authMiddleware.js";
import type { AuthService } from "../auth/auth.service.js";
import type { CategoriesService } from "./categories.service.js";

const typeSchema = z.enum(["expense", "income"]);
const createCategorySchema = z.object({
  type: typeSchema,
  name: z.string(),
  icon: z.string().optional()
});
const updateCategorySchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional()
});
const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sort: z.number()
    })
  )
});

export function createCategoriesRouter(authService: AuthService, categoriesService: CategoriesService) {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  router.get("/categories", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const type = request.query.type === undefined ? undefined : typeSchema.parse(request.query.type);
      const categories = await categoriesService.listCategories(request.currentUser!.id, type);
      response.json({ ok: true, data: { categories } });
    } catch (error) {
      next(error);
    }
  });

  router.post("/categories", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const body = createCategorySchema.parse(request.body);
      const category = await categoriesService.createCategory({
        userId: request.currentUser!.id,
        type: body.type,
        name: body.name,
        icon: body.icon
      });

      response.status(201).json({ ok: true, data: { category } });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/categories/reorder", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const body = reorderSchema.parse(request.body);
      const categories = await categoriesService.reorderCategories({
        userId: request.currentUser!.id,
        items: body.items
      });

      response.json({ ok: true, data: { categories } });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/categories/:id", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const body = updateCategorySchema.parse(request.body);
      const category = await categoriesService.updateCategory({
        userId: request.currentUser!.id,
        categoryId: request.params.id,
        name: body.name,
        icon: body.icon
      });

      response.json({ ok: true, data: { category } });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/categories/:id/disable", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const category = await categoriesService.disableCategory(request.currentUser!.id, request.params.id);
      response.json({ ok: true, data: { category } });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/categories/:id", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      const result = await categoriesService.deleteCategory(request.currentUser!.id, request.params.id);
      if (result.deleted) {
        response.status(204).send();
        return;
      }

      response.json({ ok: true, data: { category: result.category, deleted: false } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
