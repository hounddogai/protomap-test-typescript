/**
 * The fraud check plan records of referral's fraud check work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check plan is in its life cycle. */
export type FraudCheckPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fraud check plan, with what the planners need to act on it. */
export class FraudCheckPlan {
  code: string;
  label: string;
  rate: number;
  visible: boolean;
  journeyId: string;
  priority: number;
  budget: number;
  reviewer: string;
  status: FraudCheckPlanStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    visible: boolean,
    journeyId: string,
    priority: number,
    budget: number,
    reviewer: string,
    status: FraudCheckPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.visible = visible;
    this.journeyId = journeyId;
    this.priority = priority;
    this.budget = budget;
    this.reviewer = reviewer;
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

  canMoveTo(next: FraudCheckPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.budget * this.priority * 100) / 100;
  }

  copy(): FraudCheckPlan {
    return new FraudCheckPlan(
      this.code,
      this.label,
      this.rate,
      this.visible,
      this.journeyId,
      this.priority,
      this.budget,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check plan in status proposed. */
export function newFraudCheckPlan(code: string, label: string): FraudCheckPlan {
  return new FraudCheckPlan(code, label, 0, false, "", 0, 0, "", "proposed");
}
