import * as text from "../../../../kit/text.js";

/** Where a pending bid rule plan is in its life cycle. */
export type PendingBidRulePlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a pending bid rule plan and its current status. */
export class PendingBidRulePlan {
  code: string;
  label: string;
  country: string;
  maximum: number;
  budget: number;
  status: PendingBidRulePlanStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    maximum: number,
    budget: number,
    status: PendingBidRulePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.maximum = maximum;
    this.budget = budget;
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

  canMoveTo(next: PendingBidRulePlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBidRulePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedTotal(): number {
    return Math.round(this.budget * this.maximum * 100) / 100;
  }

  copy(): PendingBidRulePlan {
    return new PendingBidRulePlan(this.code, this.label, this.country, this.maximum, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending bid rule plan in status planned. */
export function newPendingBidRulePlan(code: string, label: string): PendingBidRulePlan {
  return new PendingBidRulePlan(code, label, "", 0, 0, "planned");
}
