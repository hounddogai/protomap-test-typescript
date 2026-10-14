import * as text from "../../../../kit/text.js";

/** Where a strict preference milestone is in its life cycle. */
export type StrictPreferenceMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict preference milestone as the preference team keeps it. */
export class StrictPreferenceMilestone {
  code: string;
  name: string;
  conversionRate: number;
  timezone: string;
  unit: string;
  graceDays: number;
  variant: string;
  status: StrictPreferenceMilestoneStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    timezone: string,
    unit: string,
    graceDays: number,
    variant: string,
    status: StrictPreferenceMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.timezone = timezone;
    this.unit = unit;
    this.graceDays = graceDays;
    this.variant = variant;
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

  canMoveTo(next: StrictPreferenceMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictPreferenceMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict preference milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.graceDays + this.conversionRate) * 100) / 100;
  }

  copy(): StrictPreferenceMilestone {
    return new StrictPreferenceMilestone(
      this.code,
      this.name,
      this.conversionRate,
      this.timezone,
      this.unit,
      this.graceDays,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict preference milestone in status new. */
export function newStrictPreferenceMilestone(code: string, name: string): StrictPreferenceMilestone {
  return new StrictPreferenceMilestone(code, name, 0, "", "", 0, "", "new");
}
