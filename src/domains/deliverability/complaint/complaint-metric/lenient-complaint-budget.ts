import * as text from "../../../../kit/text.js";

/** Where a lenient complaint budget is in its life cycle. */
export type LenientComplaintBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** One lenient complaint budget, with what the planners need to act on it. */
export class LenientComplaintBudget {
  code: string;
  label: string;
  utmSource: string;
  impressions: number;
  discount: number;
  windowDays: number;
  attempts: number;
  status: LenientComplaintBudgetStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    impressions: number,
    discount: number,
    windowDays: number,
    attempts: number,
    status: LenientComplaintBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.discount = discount;
    this.windowDays = windowDays;
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

  canMoveTo(next: LenientComplaintBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running" || next === "done";
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

  moveTo(next: LenientComplaintBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient complaint budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient complaint budget"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.attempts + this.windowDays) * 100) / 100;
  }

  copy(): LenientComplaintBudget {
    return new LenientComplaintBudget(
      this.code,
      this.label,
      this.utmSource,
      this.impressions,
      this.discount,
      this.windowDays,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient complaint budget in status new. */
export function newLenientComplaintBudget(code: string, label: string): LenientComplaintBudget {
  return new LenientComplaintBudget(code, label, "", 0, 0, 0, 0, "new");
}
