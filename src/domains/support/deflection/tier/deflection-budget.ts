import * as text from "../../../../kit/text.js";

/** Where a deflection budget is in its life cycle. */
export type DeflectionBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a deflection budget and its current status. */
export class DeflectionBudget {
  code: string;
  label: string;
  locale: string;
  weight: number;
  minimum: number;
  status: DeflectionBudgetStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    weight: number,
    minimum: number,
    status: DeflectionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.weight = weight;
    this.minimum = minimum;
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

  canMoveTo(next: DeflectionBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DeflectionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.weight - this.minimum) * 100) / 100;
  }

  copy(): DeflectionBudget {
    return new DeflectionBudget(this.code, this.label, this.locale, this.weight, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a deflection budget in status draft. */
export function newDeflectionBudget(code: string, label: string): DeflectionBudget {
  return new DeflectionBudget(code, label, "", 0, 0, "draft");
}
