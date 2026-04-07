/** SQLite persistence: init, repository, row types. */

export { initDatabase } from "./initDb.js";
export { createProductRepository, type ProductRepository } from "./repository.js";
export type { ProductRow, ProductStatusRow, StatusHistoryRow, StatusSnapshotInput } from "./types.js";
