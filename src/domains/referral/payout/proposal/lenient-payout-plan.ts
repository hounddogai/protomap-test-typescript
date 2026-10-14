import * as text from "../../../../kit/text.js";

/** Where a lenient payout plan is in its life cycle. */
export type LenientPayoutPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient payout plan. Its code is unique within a tenant. */
export class LenientPayoutPlan {
  code: string;
  title: string;
  ratio: number;
  limit: number;
  unit: string;
  timezone: string;
  notes: string;
  status: LenientPayoutPlanStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    limit: number,
    unit: string,
    timezone: string,
    notes: string,
    status: LenientPayoutPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.limit = limit;
    this.unit = unit;
    this.timezone = timezone;
    this.notes = notes;
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

  canMoveTo(next: LenientPayoutPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPayoutPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient payout plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round(this.limit * this.ratio * 100) / 100;
  }

  copy(): LenientPayoutPlan {
    return new LenientPayoutPlan(
      this.code,
      this.title,
      this.ratio,
      this.limit,
      this.unit,
      this.timezone,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient payout plan in status open. */
export function newLenientPayoutPlan(code: string, title: string): LenientPayoutPlan {
  return new LenientPayoutPlan(code, title, 0, 0, "", "", "", "open");
}
