import * as text from "../../../../kit/text.js";

/** Where a exit rule estimate is in its life cycle. */
export type ExitRuleEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A exit rule estimate. Its code is unique within a tenant. */
export class ExitRuleEstimate {
  code: string;
  name: string;
  rate: number;
  pinned: boolean;
  notes: string;
  status: ExitRuleEstimateStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    pinned: boolean,
    notes: string,
    status: ExitRuleEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.pinned = pinned;
    this.notes = notes;
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

  canMoveTo(next: ExitRuleEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
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

  moveTo(next: ExitRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): ExitRuleEstimate {
    return new ExitRuleEstimate(this.code, this.name, this.rate, this.pinned, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule estimate in status new. */
export function newExitRuleEstimate(code: string, name: string): ExitRuleEstimate {
  return new ExitRuleEstimate(code, name, 0, false, "", "new");
}
