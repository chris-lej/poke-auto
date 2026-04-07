/**
 * SQLite via `better-sqlite3` (sync API, native addon, good fit for a local poller).
 * Opens/creates the file, ensures parent directories exist, applies schema idempotently.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_status (
  product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  normalized_status TEXT NOT NULL,
  last_reason TEXT,
  last_page_hash TEXT,
  last_checked_at TEXT NOT NULL,
  last_alerted_at TEXT
);

CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  observed_at TEXT NOT NULL,
  normalized_status TEXT NOT NULL,
  reason TEXT,
  page_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_history_product_id ON status_history(product_id);
CREATE INDEX IF NOT EXISTS idx_status_history_product_observed
  ON status_history(product_id, observed_at DESC);
`;

export function initDatabase(databasePath: string): Database.Database {
  const absolute = path.resolve(databasePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const db = new Database(absolute);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}
