/**
 * All SQL for products, current status, and history lives here.
 */

import type Database from "better-sqlite3";
import type { ProductRow, ProductStatusRow, StatusSnapshotInput } from "./types.js";

export function createProductRepository(db: Database.Database) {
  const upsertProduct = db.prepare<
    { url: string; title: string | null; created_at: string; updated_at: string },
    { id: number }
  >(`
    INSERT INTO products (url, title, created_at, updated_at)
    VALUES (@url, @title, @created_at, @updated_at)
    ON CONFLICT(url) DO UPDATE SET
      updated_at = excluded.updated_at,
      title = COALESCE(excluded.title, products.title)
    RETURNING id
  `);

  const selectAllProducts = db.prepare<void[], ProductRow>(`
    SELECT id, url, title, created_at, updated_at
    FROM products
    ORDER BY id
  `);

  const selectStatus = db.prepare<{ product_id: number }, ProductStatusRow>(`
    SELECT product_id, normalized_status, last_reason, last_page_hash,
           last_checked_at, last_alerted_at
    FROM product_status
    WHERE product_id = @product_id
  `);

  const insertHistory = db.prepare<{
    product_id: number;
    observed_at: string;
    normalized_status: string;
    reason: string | null;
    page_hash: string | null;
  }>(`
    INSERT INTO status_history (product_id, observed_at, normalized_status, reason, page_hash)
    VALUES (@product_id, @observed_at, @normalized_status, @reason, @page_hash)
  `);

  const upsertStatus = db.prepare<{
    product_id: number;
    normalized_status: string;
    last_reason: string | null;
    last_page_hash: string | null;
    last_checked_at: string;
  }>(`
    INSERT INTO product_status (
      product_id, normalized_status, last_reason, last_page_hash, last_checked_at, last_alerted_at
    )
    VALUES (
      @product_id, @normalized_status, @last_reason, @last_page_hash, @last_checked_at, NULL
    )
    ON CONFLICT(product_id) DO UPDATE SET
      normalized_status = excluded.normalized_status,
      last_reason = excluded.last_reason,
      last_page_hash = excluded.last_page_hash,
      last_checked_at = excluded.last_checked_at
  `);

  const updateLastAlerted = db.prepare<{ product_id: number; last_alerted_at: string }>(`
    UPDATE product_status
    SET last_alerted_at = @last_alerted_at
    WHERE product_id = @product_id
  `);

  function upsertProductByUrl(url: string, title: string | null = null): number {
    const now = new Date().toISOString();
    const row = upsertProduct.get({
      url,
      title,
      created_at: now,
      updated_at: now,
    });
    if (!row) throw new Error(`upsertProductByUrl: no id for url ${url}`);
    return row.id;
  }

  function getAllProducts(): ProductRow[] {
    return selectAllProducts.all();
  }

  function getProductStatus(productId: number): ProductStatusRow | undefined {
    return selectStatus.get({ product_id: productId });
  }

  /**
   * Inserts a history row and updates the current product_status snapshot in one transaction.
   */
  function recordStatusSnapshot(productId: number, input: StatusSnapshotInput): void {
    const observedAt = (input.observedAt ?? new Date()).toISOString();
    const tx = db.transaction(() => {
      insertHistory.run({
        product_id: productId,
        observed_at: observedAt,
        normalized_status: input.normalizedStatus,
        reason: input.reason,
        page_hash: input.pageHash,
      });
      upsertStatus.run({
        product_id: productId,
        normalized_status: input.normalizedStatus,
        last_reason: input.reason,
        last_page_hash: input.pageHash,
        last_checked_at: observedAt,
      });
    });
    tx();
  }

  function setLastAlertedAt(productId: number, at: Date = new Date()): void {
    const info = updateLastAlerted.run({
      product_id: productId,
      last_alerted_at: at.toISOString(),
    });
    if (info.changes === 0) {
      throw new Error(
        `setLastAlertedAt: no product_status row for product_id ${productId} — record a snapshot first`,
      );
    }
  }

  return {
    upsertProductByUrl,
    getAllProducts,
    getProductStatus,
    recordStatusSnapshot,
    setLastAlertedAt,
  };
}

export type ProductRepository = ReturnType<typeof createProductRepository>;
