/**
 * The step budget records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step budget is in its life cycle. */
export type StepBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a step budget and its current status. */
export class StepBudget {
  code: string;
  label: string;
  limit: number;
  ceiling: number;
  ratio: number;
  unit: string;
  active: boolean;
  status: StepBudgetStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    ceiling: number,
    ratio: number,
    unit: string,
    active: boolean,
    status: StepBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.unit = unit;
    this.active = active;
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

  canMoveTo(next: StepBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StepBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"step budget"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.ceiling + this.limit) * 100) / 100;
  }

  copy(): StepBudget {
    return new StepBudget(
      this.code,
      this.label,
      this.limit,
      this.ceiling,
      this.ratio,
      this.unit,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a step budget in status new. */
export function newStepBudget(code: string, label: string): StepBudget {
  return new StepBudget(code, label, 0, 0, 0, "", false, "new");
}
