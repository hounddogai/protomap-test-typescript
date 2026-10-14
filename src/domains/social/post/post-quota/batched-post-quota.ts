/**
 * The batched post quota records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched post quota is in its life cycle. */
export type BatchedPostQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched post quota, with what the planners need to act on it. */
export class BatchedPostQuota {
  code: string;
  name: string;
  amount: number;
  rate: number;
  limit: number;
  cost: number;
  active: boolean;
  summary: string;
  country: string;
  status: BatchedPostQuotaStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    rate: number,
    limit: number,
    cost: number,
    active: boolean,
    summary: string,
    country: string,
    status: BatchedPostQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.rate = rate;
    this.limit = limit;
    this.cost = cost;
    this.active = active;
    this.summary = summary;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPostQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedPostQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched post quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.amount - this.limit) * 100) / 100;
  }

  copy(): BatchedPostQuota {
    return new BatchedPostQuota(
      this.code,
      this.name,
      this.amount,
      this.rate,
      this.limit,
      this.cost,
      this.active,
      this.summary,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched post quota in status planned. */
export function newBatchedPostQuota(code: string, name: string): BatchedPostQuota {
  return new BatchedPostQuota(code, name, 0, 0, 0, 0, false, "", "", "planned");
}
