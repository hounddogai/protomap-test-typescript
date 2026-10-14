/**
 * The tiered approval estimate records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered approval estimate is in its life cycle. */
export type TieredApprovalEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered approval estimate, with what the planners need to act on it. */
export class TieredApprovalEstimate {
  code: string;
  title: string;
  endsAt: number;
  category: string;
  graceDays: number;
  frequencyCap: number;
  status: TieredApprovalEstimateStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    category: string,
    graceDays: number,
    frequencyCap: number,
    status: TieredApprovalEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.category = category;
    this.graceDays = graceDays;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredApprovalEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredApprovalEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered approval estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered approval estimate"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.frequencyCap + this.endsAt) * 100) / 100;
  }

  copy(): TieredApprovalEstimate {
    return new TieredApprovalEstimate(
      this.code,
      this.title,
      this.endsAt,
      this.category,
      this.graceDays,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered approval estimate in status proposed. */
export function newTieredApprovalEstimate(code: string, title: string): TieredApprovalEstimate {
  return new TieredApprovalEstimate(code, title, 0, "", 0, 0, "proposed");
}
