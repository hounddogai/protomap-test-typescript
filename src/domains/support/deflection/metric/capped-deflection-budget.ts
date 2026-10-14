import * as text from "../../../../kit/text.js";

/** Where a capped deflection budget is in its life cycle. */
export type CappedDeflectionBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped deflection budget. Its code is unique within a tenant. */
export class CappedDeflectionBudget {
  code: string;
  label: string;
  clicks: number;
  threshold: number;
  bid: number;
  ceiling: number;
  budget: number;
  openRate: number;
  cost: number;
  status: CappedDeflectionBudgetStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    threshold: number,
    bid: number,
    ceiling: number,
    budget: number,
    openRate: number,
    cost: number,
    status: CappedDeflectionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.threshold = threshold;
    this.bid = bid;
    this.ceiling = ceiling;
    this.budget = budget;
    this.openRate = openRate;
    this.cost = cost;
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

  canMoveTo(next: CappedDeflectionBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
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

  moveTo(next: CappedDeflectionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped deflection budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped deflection budget"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.budget + this.bid) * 100) / 100;
  }

  copy(): CappedDeflectionBudget {
    return new CappedDeflectionBudget(
      this.code,
      this.label,
      this.clicks,
      this.threshold,
      this.bid,
      this.ceiling,
      this.budget,
      this.openRate,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped deflection budget in status planned. */
export function newCappedDeflectionBudget(code: string, label: string): CappedDeflectionBudget {
  return new CappedDeflectionBudget(code, label, 0, 0, 0, 0, 0, 0, 0, "planned");
}
