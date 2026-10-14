/**
 * The opt out budget records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out budget is in its life cycle. */
export type OptOutBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A opt out budget. Its code is unique within a tenant. */
export class OptOutBudget {
  code: string;
  name: string;
  quantity: number;
  openRate: number;
  unit: string;
  capacity: number;
  score: number;
  status: OptOutBudgetStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    openRate: number,
    unit: string,
    capacity: number,
    score: number,
    status: OptOutBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.openRate = openRate;
    this.unit = unit;
    this.capacity = capacity;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: OptOutBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.openRate + this.capacity) * 100) / 100;
  }

  copy(): OptOutBudget {
    return new OptOutBudget(
      this.code,
      this.name,
      this.quantity,
      this.openRate,
      this.unit,
      this.capacity,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a opt out budget in status new. */
export function newOptOutBudget(code: string, name: string): OptOutBudget {
  return new OptOutBudget(code, name, 0, 0, "", 0, 0, "new");
}
