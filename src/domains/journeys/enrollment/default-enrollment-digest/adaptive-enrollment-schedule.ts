import * as text from "../../../../kit/text.js";

/** Where a adaptive enrollment schedule is in its life cycle. */
export type AdaptiveEnrollmentScheduleStatus = "created" | "validated" | "published" | "retired";

/** The record of a adaptive enrollment schedule and its current status. */
export class AdaptiveEnrollmentSchedule {
  code: string;
  name: string;
  graceDays: number;
  margin: number;
  active: boolean;
  batchSize: number;
  channel: string;
  utmSource: string;
  status: AdaptiveEnrollmentScheduleStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    margin: number,
    active: boolean,
    batchSize: number,
    channel: string,
    utmSource: string,
    status: AdaptiveEnrollmentScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.margin = margin;
    this.active = active;
    this.batchSize = batchSize;
    this.channel = channel;
    this.utmSource = utmSource;
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

  canMoveTo(next: AdaptiveEnrollmentScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
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

  moveTo(next: AdaptiveEnrollmentScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive enrollment schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.graceDays + this.margin) * 100) / 100;
  }

  copy(): AdaptiveEnrollmentSchedule {
    return new AdaptiveEnrollmentSchedule(
      this.code,
      this.name,
      this.graceDays,
      this.margin,
      this.active,
      this.batchSize,
      this.channel,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive enrollment schedule in status created. */
export function newAdaptiveEnrollmentSchedule(code: string, name: string): AdaptiveEnrollmentSchedule {
  return new AdaptiveEnrollmentSchedule(code, name, 0, 0, false, 0, "", "", "created");
}
