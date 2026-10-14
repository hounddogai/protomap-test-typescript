import * as text from "../../../../kit/text.js";

/** Where a nudge schedule is in its life cycle. */
export type NudgeScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A nudge schedule as the nudge team keeps it. */
export class NudgeSchedule {
  code: string;
  label: string;
  endsAt: number;
  unit: string;
  country: string;
  variant: string;
  floorValue: number;
  status: NudgeScheduleStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    unit: string,
    country: string,
    variant: string,
    floorValue: number,
    status: NudgeScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.unit = unit;
    this.country = country;
    this.variant = variant;
    this.floorValue = floorValue;
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

  canMoveTo(next: NudgeScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
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

  moveTo(next: NudgeScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"nudge schedule"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.endsAt - this.floorValue) * 100) / 100;
  }

  copy(): NudgeSchedule {
    return new NudgeSchedule(
      this.code,
      this.label,
      this.endsAt,
      this.unit,
      this.country,
      this.variant,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a nudge schedule in status open. */
export function newNudgeSchedule(code: string, label: string): NudgeSchedule {
  return new NudgeSchedule(code, label, 0, "", "", "", 0, "open");
}
