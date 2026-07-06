import { Router } from "express";
import { z } from "zod";
import {
  createAuthMiddleware,
  type AuthenticatedRequest,
} from "../../middlewares/authMiddleware.js";
import type { AuthService } from "../auth/auth.service.js";
import type { BillsService } from "./bills.service.js";

const typeSchema = z.enum(["expense", "income"]);
const createBillSchema = z.object({
  bookId: z.string(),
  categoryId: z.string(),
  type: typeSchema,
  amount: z.string(),
  remark: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  happenedAt: z.string(),
});
const updateBillSchema = createBillSchema.partial();

export function createBillsRouter(
  authService: AuthService,
  billsService: BillsService,
) {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  router.get(
    "/bills",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const type =
          request.query.type === undefined
            ? undefined
            : typeSchema.parse(request.query.type);
        const bills = await billsService.listBills({
          userId: request.currentUser!.id,
          bookId: parseOptionalQuery(request.query.bookId),
          month: parseOptionalQuery(request.query.month),
          type,
          categoryId: parseOptionalQuery(request.query.categoryId),
        });

        response.json({ ok: true, data: { bills } });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/bills/:id",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const bill = await billsService.getBill(
          request.currentUser!.id,
          request.params.id,
        );
        response.json({ ok: true, data: { bill } });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/bills",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const body = createBillSchema.parse(request.body);
        const bill = await billsService.createBill({
          userId: request.currentUser!.id,
          ...body,
        });

        response.status(201).json({ ok: true, data: { bill } });
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    "/bills/:id",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const body = updateBillSchema.parse(request.body);
        const bill = await billsService.updateBill({
          userId: request.currentUser!.id,
          billId: request.params.id,
          ...body,
        });

        response.json({ ok: true, data: { bill } });
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    "/bills/:id",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        await billsService.deleteBill(
          request.currentUser!.id,
          request.params.id,
        );
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

function parseOptionalQuery(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
