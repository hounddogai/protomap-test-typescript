import * as text from "../../../../kit/text.js";

/** Where a rolling exit rule review is in its life cycle. */
export type RollingExitRuleReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling exit rule review and its current status. */
export class RollingExitRuleReview {
  code: string;
  label: string;
  campaignRef: string;
  budget: number;
  amount: number;
  sendAt: number;
  cost: number;
  status: RollingExitRuleReviewStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    budget: number,
    amount: number,
    sendAt: number,
    cost: number,
    status: RollingExitRuleReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.amount = amount;
    this.sendAt = sendAt;
    this.cost = cost;
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

  canMoveTo(next: RollingExitRuleReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingExitRuleReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling exit rule review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.amount + this.cost) * 100) / 100;
  }

  copy(): RollingExitRuleReview {
    return new RollingExitRuleReview(
      this.code,
      this.label,
      this.campaignRef,
      this.budget,
      this.amount,
      this.sendAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling exit rule review in status proposed. */
export function newRollingExitRuleReview(code: string, label: string): RollingExitRuleReview {
  return new RollingExitRuleReview(code, label, "", 0, 0, 0, 0, "proposed");
}
