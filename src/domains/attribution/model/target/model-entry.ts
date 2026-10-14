import * as text from "../../../../kit/text.js";

/** Where a model entry is in its life cycle. */
export type ModelEntryStatus = "created" | "validated" | "published" | "retired";

/** A model entry. Its code is unique within a tenant. */
export class ModelEntry {
  code: string;
  title: string;
  ceiling: number;
  batchSize: number;
  campaignRef: string;
  expiresAt: number;
  cost: number;
  retries: number;
  version: number;
  status: ModelEntryStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    batchSize: number,
    campaignRef: string,
    expiresAt: number,
    cost: number,
    retries: number,
    version: number,
    status: ModelEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.retries = retries;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ModelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round(this.cost * this.batchSize * 100) / 100;
  }

  copy(): ModelEntry {
    return new ModelEntry(
      this.code,
      this.title,
      this.ceiling,
      this.batchSize,
      this.campaignRef,
      this.expiresAt,
      this.cost,
      this.retries,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a model entry in status created. */
export function newModelEntry(code: string, title: string): ModelEntry {
  return new ModelEntry(code, title, 0, 0, "", 0, 0, 0, 0, "created");
}
