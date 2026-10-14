import * as text from "../../../../kit/text.js";

/** Where a global level assignment is in its life cycle. */
export type GlobalLevelAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global level assignment as the level team keeps it. */
export class GlobalLevelAssignment {
  code: string;
  name: string;
  amount: number;
  retries: number;
  conversionRate: number;
  status: GlobalLevelAssignmentStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    retries: number,
    conversionRate: number,
    status: GlobalLevelAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.retries = retries;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: GlobalLevelAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalLevelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global level assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.retries + this.conversionRate) * 100) / 100;
  }

  copy(): GlobalLevelAssignment {
    return new GlobalLevelAssignment(this.code, this.name, this.amount, this.retries, this.conversionRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global level assignment in status new. */
export function newGlobalLevelAssignment(code: string, name: string): GlobalLevelAssignment {
  return new GlobalLevelAssignment(code, name, 0, 0, 0, "new");
}
