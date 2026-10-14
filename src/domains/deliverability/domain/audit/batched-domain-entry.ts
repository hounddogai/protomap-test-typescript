import * as text from "../../../../kit/text.js";

/** Where a batched domain entry is in its life cycle. */
export type BatchedDomainEntryStatus = "created" | "validated" | "published" | "retired";

/** A batched domain entry. Its code is unique within a tenant. */
export class BatchedDomainEntry {
  code: string;
  name: string;
  ownerId: string;
  description: string;
  summary: string;
  batchSize: number;
  title: string;
  country: string;
  amount: number;
  impressions: number;
  graceDays: number;
  status: BatchedDomainEntryStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    description: string,
    summary: string,
    batchSize: number,
    title: string,
    country: string,
    amount: number,
    impressions: number,
    graceDays: number,
    status: BatchedDomainEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.description = description;
    this.summary = summary;
    this.batchSize = batchSize;
    this.title = title;
    this.country = country;
    this.amount = amount;
    this.impressions = impressions;
    this.graceDays = graceDays;
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

  canMoveTo(next: BatchedDomainEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedDomainEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched domain entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched domain entry"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.impressions - this.amount) * 100) / 100;
  }

  copy(): BatchedDomainEntry {
    return new BatchedDomainEntry(
      this.code,
      this.name,
      this.ownerId,
      this.description,
      this.summary,
      this.batchSize,
      this.title,
      this.country,
      this.amount,
      this.impressions,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched domain entry in status created. */
export function newBatchedDomainEntry(code: string, name: string): BatchedDomainEntry {
  return new BatchedDomainEntry(code, name, "", "", "", 0, "", "", 0, 0, 0, "created");
}
