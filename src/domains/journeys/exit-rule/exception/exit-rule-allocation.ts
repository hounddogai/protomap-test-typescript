import * as text from "../../../../kit/text.js";

/** Where a exit rule allocation is in its life cycle. */
export type ExitRuleAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A exit rule allocation as the exit rule team keeps it. */
export class ExitRuleAllocation {
  code: string;
  title: string;
  active: boolean;
  floorValue: number;
  score: number;
  status: ExitRuleAllocationStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    floorValue: number,
    score: number,
    status: ExitRuleAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.floorValue = floorValue;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ExitRuleAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule allocation"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.floorValue * this.score * 100) / 100;
  }

  copy(): ExitRuleAllocation {
    return new ExitRuleAllocation(this.code, this.title, this.active, this.floorValue, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule allocation in status open. */
export function newExitRuleAllocation(code: string, title: string): ExitRuleAllocation {
  return new ExitRuleAllocation(code, title, false, 0, 0, "open");
}
