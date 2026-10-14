import * as text from "../../../../kit/text.js";

/** Where a batched level entry is in its life cycle. */
export type BatchedLevelEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched level entry. Its code is unique within a tenant. */
export class BatchedLevelEntry {
  code: string;
  name: string;
  expiresAt: number;
  description: string;
  locale: string;
  createdAt: number;
  batchSize: number;
  variant: string;
  margin: number;
  status: BatchedLevelEntryStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    description: string,
    locale: string,
    createdAt: number,
    batchSize: number,
    variant: string,
    margin: number,
    status: BatchedLevelEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.description = description;
    this.locale = locale;
    this.createdAt = createdAt;
    this.batchSize = batchSize;
    this.variant = variant;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedLevelEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedLevelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched level entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched level entry"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.createdAt * this.expiresAt * 100) / 100;
  }

  copy(): BatchedLevelEntry {
    return new BatchedLevelEntry(
      this.code,
      this.name,
      this.expiresAt,
      this.description,
      this.locale,
      this.createdAt,
      this.batchSize,
      this.variant,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched level entry in status requested. */
export function newBatchedLevelEntry(code: string, name: string): BatchedLevelEntry {
  return new BatchedLevelEntry(code, name, 0, "", "", 0, 0, "", 0, "requested");
}
