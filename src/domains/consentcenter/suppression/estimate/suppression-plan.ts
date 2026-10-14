import * as text from "../../../../kit/text.js";

/** Where a suppression plan is in its life cycle. */
export type SuppressionPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression plan. Its code is unique within a tenant. */
export class SuppressionPlan {
  code: string;
  label: string;
  locale: string;
  budget: number;
  minimum: number;
  status: SuppressionPlanStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    budget: number,
    minimum: number,
    status: SuppressionPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.budget = budget;
    this.minimum = minimum;
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

  canMoveTo(next: SuppressionPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SuppressionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.minimum * this.budget * 100) / 100;
  }

  copy(): SuppressionPlan {
    return new SuppressionPlan(this.code, this.label, this.locale, this.budget, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a suppression plan in status planned. */
export function newSuppressionPlan(code: string, label: string): SuppressionPlan {
  return new SuppressionPlan(code, label, "", 0, 0, "planned");
}
