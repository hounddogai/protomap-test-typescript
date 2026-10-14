import * as text from "../../../../kit/text.js";

/** Where a manual payout plan is in its life cycle. */
export type ManualPayoutPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual payout plan as the payout team keeps it. */
export class ManualPayoutPlan {
  code: string;
  name: string;
  country: string;
  budget: number;
  priority: number;
  status: ManualPayoutPlanStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    budget: number,
    priority: number,
    status: ManualPayoutPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.budget = budget;
    this.priority = priority;
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

  canMoveTo(next: ManualPayoutPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
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

  moveTo(next: ManualPayoutPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual payout plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.budget + this.priority) * 100) / 100;
  }

  copy(): ManualPayoutPlan {
    return new ManualPayoutPlan(this.code, this.name, this.country, this.budget, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual payout plan in status planned. */
export function newManualPayoutPlan(code: string, name: string): ManualPayoutPlan {
  return new ManualPayoutPlan(code, name, "", 0, 0, "planned");
}
