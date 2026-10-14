/**
 * The batched reputation ledger records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched reputation ledger is in its life cycle. */
export type BatchedReputationLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched reputation ledger as the reputation team keeps it. */
export class BatchedReputationLedger {
  code: string;
  name: string;
  channel: string;
  notes: string;
  cost: number;
  createdAt: number;
  attempts: number;
  discount: number;
  locale: string;
  ratio: number;
  limit: number;
  status: BatchedReputationLedgerStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    notes: string,
    cost: number,
    createdAt: number,
    attempts: number,
    discount: number,
    locale: string,
    ratio: number,
    limit: number,
    status: BatchedReputationLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.notes = notes;
    this.cost = cost;
    this.createdAt = createdAt;
    this.attempts = attempts;
    this.discount = discount;
    this.locale = locale;
    this.ratio = ratio;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedReputationLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedReputationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reputation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round(this.ratio * this.cost * 100) / 100;
  }

  copy(): BatchedReputationLedger {
    return new BatchedReputationLedger(
      this.code,
      this.name,
      this.channel,
      this.notes,
      this.cost,
      this.createdAt,
      this.attempts,
      this.discount,
      this.locale,
      this.ratio,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched reputation ledger in status draft. */
export function newBatchedReputationLedger(code: string, name: string): BatchedReputationLedger {
  return new BatchedReputationLedger(code, name, "", "", 0, 0, 0, 0, "", 0, 0, "draft");
}
