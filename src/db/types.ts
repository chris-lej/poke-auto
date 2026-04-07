/** Row shapes returned by the repository (SQLite stores datetimes as ISO 8601 text). */

export type ProductRow = {
  id: number;
  url: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductStatusRow = {
  product_id: number;
  normalized_status: string;
  last_reason: string | null;
  last_page_hash: string | null;
  last_checked_at: string;
  last_alerted_at: string | null;
};

export type StatusHistoryRow = {
  id: number;
  product_id: number;
  observed_at: string;
  normalized_status: string;
  reason: string | null;
  page_hash: string | null;
};

export type StatusSnapshotInput = {
  normalizedStatus: string;
  reason: string | null;
  pageHash: string | null;
  /** Wall-clock observation time; defaults to now. */
  observedAt?: Date;
};
