import * as text from "../../../../kit/text.js";

/** Where a batched reward rule estimate is in its life cycle. */
export type BatchedRewardRuleEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched reward rule estimate and its current status. */
export class BatchedRewardRuleEstimate {
  code: string;
  label: string;
  ownerId: string;
  currency: string;
  windowDays: number;
  budget: number;
  pinned: boolean;
  endsAt: number;
  rate: number;
  status: BatchedRewardRuleEstimateStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    currency: string,
    windowDays: number,
    budget: number,
    pinned: boolean,
    endsAt: number,
    rate: number,
    status: BatchedRewardRuleEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.currency = currency;
    this.windowDays = windowDays;
    this.budget = budget;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.rate = rate;
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

  canMoveTo(next: BatchedRewardRuleEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedRewardRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reward rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched reward rule estimate"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.rate - this.endsAt) * 100) / 100;
  }

  copy(): BatchedRewardRuleEstimate {
    return new BatchedRewardRuleEstimate(
      this.code,
      this.label,
      this.ownerId,
      this.currency,
      this.windowDays,
      this.budget,
      this.pinned,
      this.endsAt,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched reward rule estimate in status draft. */
export function newBatchedRewardRuleEstimate(code: string, label: string): BatchedRewardRuleEstimate {
  return new BatchedRewardRuleEstimate(code, label, "", "", 0, 0, false, 0, 0, "draft");
}
