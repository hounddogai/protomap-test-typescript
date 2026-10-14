import * as text from "../../../../kit/text.js";

/** Where a pacing schedule is in its life cycle. */
export type PacingScheduleStatus = "created" | "validated" | "published" | "retired";

/** A pacing schedule. Its code is unique within a tenant. */
export class PacingSchedule {
  code: string;
  label: string;
  quantity: number;
  startsAt: number;
  clicks: number;
  minimum: number;
  timezone: string;
  country: string;
  conversionRate: number;
  status: PacingScheduleStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    startsAt: number,
    clicks: number,
    minimum: number,
    timezone: string,
    country: string,
    conversionRate: number,
    status: PacingScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.minimum = minimum;
    this.timezone = timezone;
    this.country = country;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pacing schedule"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.conversionRate - this.quantity) * 100) / 100;
  }

  copy(): PacingSchedule {
    return new PacingSchedule(
      this.code,
      this.label,
      this.quantity,
      this.startsAt,
      this.clicks,
      this.minimum,
      this.timezone,
      this.country,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pacing schedule in status created. */
export function newPacingSchedule(code: string, label: string): PacingSchedule {
  return new PacingSchedule(code, label, 0, 0, 0, 0, "", "", 0, "created");
}
