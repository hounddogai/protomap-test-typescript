import * as text from "../../../../kit/text.js";

/** Where a seasonal streak policy is in its life cycle. */
export type SeasonalStreakPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a seasonal streak policy and its current status. */
export class SeasonalStreakPolicy {
  code: string;
  name: string;
  updatedAt: number;
  clicks: number;
  timezone: string;
  ceiling: number;
  impressions: number;
  windowDays: number;
  durationMinutes: number;
  budget: number;
  batchSize: number;
  status: SeasonalStreakPolicyStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    clicks: number,
    timezone: string,
    ceiling: number,
    impressions: number,
    windowDays: number,
    durationMinutes: number,
    budget: number,
    batchSize: number,
    status: SeasonalStreakPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.batchSize = batchSize;
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

  canMoveTo(next: SeasonalStreakPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalStreakPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal streak policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.durationMinutes - this.ceiling) * 100) / 100;
  }

  copy(): SeasonalStreakPolicy {
    return new SeasonalStreakPolicy(
      this.code,
      this.name,
      this.updatedAt,
      this.clicks,
      this.timezone,
      this.ceiling,
      this.impressions,
      this.windowDays,
      this.durationMinutes,
      this.budget,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal streak policy in status open. */
export function newSeasonalStreakPolicy(code: string, name: string): SeasonalStreakPolicy {
  return new SeasonalStreakPolicy(code, name, 0, 0, "", 0, 0, 0, 0, 0, 0, "open");
}
