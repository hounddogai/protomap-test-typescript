/**
 * The fallback approval quota records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback approval quota is in its life cycle. */
export type FallbackApprovalQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fallback approval quota, with what the planners need to act on it. */
export class FallbackApprovalQuota {
  code: string;
  name: string;
  budget: number;
  label: string;
  rate: number;
  quantity: number;
  amount: number;
  summary: string;
  status: FallbackApprovalQuotaStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    label: string,
    rate: number,
    quantity: number,
    amount: number,
    summary: string,
    status: FallbackApprovalQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.label = label;
    this.rate = rate;
    this.quantity = quantity;
    this.amount = amount;
    this.summary = summary;
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

  canMoveTo(next: FallbackApprovalQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "done";
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

  moveTo(next: FallbackApprovalQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback approval quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.quantity - this.amount) * 100) / 100;
  }

  copy(): FallbackApprovalQuota {
    return new FallbackApprovalQuota(
      this.code,
      this.name,
      this.budget,
      this.label,
      this.rate,
      this.quantity,
      this.amount,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback approval quota in status new. */
export function newFallbackApprovalQuota(code: string, name: string): FallbackApprovalQuota {
  return new FallbackApprovalQuota(code, name, 0, "", 0, 0, 0, "", "new");
}
