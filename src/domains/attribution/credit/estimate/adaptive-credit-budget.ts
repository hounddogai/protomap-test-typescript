import * as text from "../../../../kit/text.js";

/** Where a adaptive credit budget is in its life cycle. */
export type AdaptiveCreditBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive credit budget and its current status. */
export class AdaptiveCreditBudget {
  code: string;
  title: string;
  cost: number;
  ownerId: string;
  description: string;
  cohort: string;
  status: AdaptiveCreditBudgetStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    ownerId: string,
    description: string,
    cohort: string,
    status: AdaptiveCreditBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.ownerId = ownerId;
    this.description = description;
    this.cohort = cohort;
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

  canMoveTo(next: AdaptiveCreditBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveCreditBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive credit budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive credit budget"} ${this.code}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): AdaptiveCreditBudget {
    return new AdaptiveCreditBudget(
      this.code,
      this.title,
      this.cost,
      this.ownerId,
      this.description,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive credit budget in status draft. */
export function newAdaptiveCreditBudget(code: string, title: string): AdaptiveCreditBudget {
  return new AdaptiveCreditBudget(code, title, 0, "", "", "", "draft");
}
