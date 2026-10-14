import * as text from "../../../../kit/text.js";

/** Where a exit rule adjustment is in its life cycle. */
export type ExitRuleAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A exit rule adjustment as the exit rule team keeps it. */
export class ExitRuleAdjustment {
  code: string;
  title: string;
  frequencyCap: number;
  weight: number;
  clicks: number;
  notes: string;
  status: ExitRuleAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    weight: number,
    clicks: number,
    notes: string,
    status: ExitRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.clicks = clicks;
    this.notes = notes;
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

  canMoveTo(next: ExitRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ExitRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule adjustment"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.frequencyCap + this.weight) * 100) / 100;
  }

  copy(): ExitRuleAdjustment {
    return new ExitRuleAdjustment(
      this.code,
      this.title,
      this.frequencyCap,
      this.weight,
      this.clicks,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule adjustment in status proposed. */
export function newExitRuleAdjustment(code: string, title: string): ExitRuleAdjustment {
  return new ExitRuleAdjustment(code, title, 0, 0, 0, "", "proposed");
}
