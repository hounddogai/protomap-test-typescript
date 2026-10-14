/**
 * The streak forecast records of loyaltyhub's streak work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak forecast is in its life cycle. */
export type StreakForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A streak forecast. Its code is unique within a tenant. */
export class StreakForecast {
  code: string;
  title: string;
  budget: number;
  expiresAt: number;
  impressions: number;
  source: string;
  status: StreakForecastStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    expiresAt: number,
    impressions: number,
    source: string,
    status: StreakForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.impressions = impressions;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"streak forecast"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.budget - this.impressions) * 100) / 100;
  }

  copy(): StreakForecast {
    return new StreakForecast(
      this.code,
      this.title,
      this.budget,
      this.expiresAt,
      this.impressions,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a streak forecast in status draft. */
export function newStreakForecast(code: string, title: string): StreakForecast {
  return new StreakForecast(code, title, 0, 0, 0, "", "draft");
}
