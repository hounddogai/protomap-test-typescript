/**
 * The batched mention ledger records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched mention ledger is in its life cycle. */
export type BatchedMentionLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a batched mention ledger and its current status. */
export class BatchedMentionLedger {
  code: string;
  label: string;
  category: string;
  cost: number;
  conversionRate: number;
  title: string;
  segment: string;
  capacity: number;
  quantity: number;
  status: BatchedMentionLedgerStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    cost: number,
    conversionRate: number,
    title: string,
    segment: string,
    capacity: number,
    quantity: number,
    status: BatchedMentionLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.cost = cost;
    this.conversionRate = conversionRate;
    this.title = title;
    this.segment = segment;
    this.capacity = capacity;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedMentionLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedMentionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched mention ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched mention ledger"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.cost + this.capacity) * 100) / 100;
  }

  copy(): BatchedMentionLedger {
    return new BatchedMentionLedger(
      this.code,
      this.label,
      this.category,
      this.cost,
      this.conversionRate,
      this.title,
      this.segment,
      this.capacity,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched mention ledger in status new. */
export function newBatchedMentionLedger(code: string, label: string): BatchedMentionLedger {
  return new BatchedMentionLedger(code, label, "", 0, 0, "", "", 0, 0, "new");
}
