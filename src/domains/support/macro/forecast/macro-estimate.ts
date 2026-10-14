import * as text from "../../../../kit/text.js";

/** Where a macro estimate is in its life cycle. */
export type MacroEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One macro estimate, with what the planners need to act on it. */
export class MacroEstimate {
  code: string;
  title: string;
  amount: number;
  graceDays: number;
  threshold: number;
  ownerId: string;
  status: MacroEstimateStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    graceDays: number,
    threshold: number,
    ownerId: string,
    status: MacroEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.graceDays = graceDays;
    this.threshold = threshold;
    this.ownerId = ownerId;
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

  canMoveTo(next: MacroEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: MacroEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.graceDays + this.threshold) * 100) / 100;
  }

  copy(): MacroEstimate {
    return new MacroEstimate(
      this.code,
      this.title,
      this.amount,
      this.graceDays,
      this.threshold,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a macro estimate in status planned. */
export function newMacroEstimate(code: string, title: string): MacroEstimate {
  return new MacroEstimate(code, title, 0, 0, 0, "", "planned");
}
