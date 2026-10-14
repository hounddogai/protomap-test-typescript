/**
 * The batched model entry records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched model entry is in its life cycle. */
export type BatchedModelEntryStatus = "created" | "validated" | "published" | "retired";

/** One batched model entry, with what the planners need to act on it. */
export class BatchedModelEntry {
  code: string;
  title: string;
  timezone: string;
  amount: number;
  bid: number;
  status: BatchedModelEntryStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    amount: number,
    bid: number,
    status: BatchedModelEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.amount = amount;
    this.bid = bid;
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

  canMoveTo(next: BatchedModelEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedModelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched model entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round(this.amount * this.bid * 100) / 100;
  }

  copy(): BatchedModelEntry {
    return new BatchedModelEntry(this.code, this.title, this.timezone, this.amount, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched model entry in status created. */
export function newBatchedModelEntry(code: string, title: string): BatchedModelEntry {
  return new BatchedModelEntry(code, title, "", 0, 0, "created");
}
