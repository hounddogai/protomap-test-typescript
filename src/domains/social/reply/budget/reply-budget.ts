/**
 * The reply budget records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply budget is in its life cycle. */
export type ReplyBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reply budget. Its code is unique within a tenant. */
export class ReplyBudget {
  code: string;
  label: string;
  expiresAt: number;
  batchSize: number;
  limit: number;
  status: ReplyBudgetStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    batchSize: number,
    limit: number,
    status: ReplyBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.batchSize = batchSize;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.expiresAt + this.batchSize) * 100) / 100;
  }

  copy(): ReplyBudget {
    return new ReplyBudget(this.code, this.label, this.expiresAt, this.batchSize, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply budget in status idle. */
export function newReplyBudget(code: string, label: string): ReplyBudget {
  return new ReplyBudget(code, label, 0, 0, 0, "idle");
}
