import * as text from "../../../../kit/text.js";

/** Where a rolling post budget is in its life cycle. */
export type RollingPostBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling post budget, with what the planners need to act on it. */
export class RollingPostBudget {
  code: string;
  name: string;
  sequence: number;
  unit: string;
  pinned: boolean;
  quantity: number;
  reviewer: string;
  durationMinutes: number;
  status: RollingPostBudgetStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    unit: string,
    pinned: boolean,
    quantity: number,
    reviewer: string,
    durationMinutes: number,
    status: RollingPostBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.unit = unit;
    this.pinned = pinned;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: RollingPostBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingPostBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling post budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling post budget"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.durationMinutes * this.quantity * 100) / 100;
  }

  copy(): RollingPostBudget {
    return new RollingPostBudget(
      this.code,
      this.name,
      this.sequence,
      this.unit,
      this.pinned,
      this.quantity,
      this.reviewer,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling post budget in status proposed. */
export function newRollingPostBudget(code: string, name: string): RollingPostBudget {
  return new RollingPostBudget(code, name, 0, "", false, 0, "", 0, "proposed");
}
