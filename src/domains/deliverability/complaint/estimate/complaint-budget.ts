import * as text from "../../../../kit/text.js";

/** Where a complaint budget is in its life cycle. */
export type ComplaintBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a complaint budget and its current status. */
export class ComplaintBudget {
  code: string;
  name: string;
  sequence: number;
  notes: string;
  quantity: number;
  status: ComplaintBudgetStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    notes: string,
    quantity: number,
    status: ComplaintBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.notes = notes;
    this.quantity = quantity;
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

  canMoveTo(next: ComplaintBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ComplaintBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"complaint budget"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.quantity * this.sequence * 100) / 100;
  }

  copy(): ComplaintBudget {
    return new ComplaintBudget(this.code, this.name, this.sequence, this.notes, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a complaint budget in status new. */
export function newComplaintBudget(code: string, name: string): ComplaintBudget {
  return new ComplaintBudget(code, name, 0, "", 0, "new");
}
