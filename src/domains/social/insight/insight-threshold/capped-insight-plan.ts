import * as text from "../../../../kit/text.js";

/** Where a capped insight plan is in its life cycle. */
export type CappedInsightPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped insight plan. Its code is unique within a tenant. */
export class CappedInsightPlan {
  code: string;
  name: string;
  windowDays: number;
  notes: string;
  quantity: number;
  floorValue: number;
  attempts: number;
  status: CappedInsightPlanStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    notes: string,
    quantity: number,
    floorValue: number,
    attempts: number,
    status: CappedInsightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.notes = notes;
    this.quantity = quantity;
    this.floorValue = floorValue;
    this.attempts = attempts;
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

  canMoveTo(next: CappedInsightPlanStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedInsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.windowDays - this.attempts) * 100) / 100;
  }

  copy(): CappedInsightPlan {
    return new CappedInsightPlan(
      this.code,
      this.name,
      this.windowDays,
      this.notes,
      this.quantity,
      this.floorValue,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped insight plan in status new. */
export function newCappedInsightPlan(code: string, name: string): CappedInsightPlan {
  return new CappedInsightPlan(code, name, 0, "", 0, 0, 0, "new");
}
