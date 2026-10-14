/**
 * The batched opt out baseline records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched opt out baseline is in its life cycle. */
export type BatchedOptOutBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched opt out baseline. Its code is unique within a tenant. */
export class BatchedOptOutBaseline {
  code: string;
  title: string;
  campaignRef: string;
  channel: string;
  updatedAt: number;
  cost: number;
  status: BatchedOptOutBaselineStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    channel: string,
    updatedAt: number,
    cost: number,
    status: BatchedOptOutBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.cost = cost;
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

  canMoveTo(next: BatchedOptOutBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedOptOutBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched opt out baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round((this.cost - this.updatedAt) * 100) / 100;
  }

  copy(): BatchedOptOutBaseline {
    return new BatchedOptOutBaseline(
      this.code,
      this.title,
      this.campaignRef,
      this.channel,
      this.updatedAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched opt out baseline in status new. */
export function newBatchedOptOutBaseline(code: string, title: string): BatchedOptOutBaseline {
  return new BatchedOptOutBaseline(code, title, "", "", 0, 0, "new");
}
