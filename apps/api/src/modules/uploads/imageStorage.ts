import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageUploadRules } from "@accounting-app/shared";
import { AppError } from "../../errors/AppError.js";

const mimeToExtension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

export class ImageStorage {
  constructor(private readonly uploadDir: string) {}

  async saveBillImage(file: { buffer: Buffer; mimetype: string; size: number }) {
    if (!imageUploadRules.mimeTypes.includes(file.mimetype as (typeof imageUploadRules.mimeTypes)[number])) {
      throw new AppError("Unsupported image type", 400);
    }

    if (file.size > imageUploadRules.maxBytes) {
      throw new AppError("Image size must be at most 5MB", 400);
    }

    const relativeDir = path.join("bills");
    const absoluteDir = path.join(this.uploadDir, relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const filename = `${randomUUID()}${mimeToExtension[file.mimetype]}`;
    const relativePath = `/uploads/${relativeDir.replaceAll(path.sep, "/")}/${filename}`;
    await writeFile(path.join(absoluteDir, filename), file.buffer);

    return relativePath;
  }

  async deleteByUrl(imageUrl: string | null | undefined) {
    if (!imageUrl?.startsWith("/uploads/bills/")) {
      return;
    }

    const relativePath = imageUrl.replace(/^\/uploads\//, "");
    const absolutePath = path.resolve(this.uploadDir, relativePath);
    const uploadRoot = path.resolve(this.uploadDir);
    const relativeFromRoot = path.relative(uploadRoot, absolutePath);
    if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
      return;
    }

    await rm(absolutePath, { force: true });
  }
}
