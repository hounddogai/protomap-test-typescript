import * as text from "../../../../kit/text.js";

/** Where a pending tier threshold is in its life cycle. */
export type PendingTierThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending tier threshold and its current status. */
export class PendingTierThreshold {
  code: string;
  title: string;
  country: string;
  ceiling: number;
  channel: string;
  timezone: string;
  windowDays: number;
  cohort: string;
  ownerId: string;
  status: PendingTierThresholdStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    ceiling: number,
    channel: string,
    timezone: string,
    windowDays: number,
    cohort: string,
    ownerId: string,
    status: PendingTierThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.ceiling = ceiling;
    this.channel = channel;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.ownerId = ownerId;
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

  canMoveTo(next: PendingTierThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: PendingTierThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending tier threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending tier threshold"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.windowDays + this.ceiling) * 100) / 100;
  }

  copy(): PendingTierThreshold {
    return new PendingTierThreshold(
      this.code,
      this.title,
      this.country,
      this.ceiling,
      this.channel,
      this.timezone,
      this.windowDays,
      this.cohort,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending tier threshold in status open. */
export function newPendingTierThreshold(code: string, title: string): PendingTierThreshold {
  return new PendingTierThreshold(code, title, "", 0, "", "", 0, "", "", "open");
}
