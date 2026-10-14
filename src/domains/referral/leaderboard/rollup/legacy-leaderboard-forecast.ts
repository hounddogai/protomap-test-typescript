import * as text from "../../../../kit/text.js";

/** Where a legacy leaderboard forecast is in its life cycle. */
export type LegacyLeaderboardForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy leaderboard forecast as the leaderboard team keeps it. */
export class LegacyLeaderboardForecast {
  code: string;
  label: string;
  attempts: number;
  unit: string;
  description: string;
  journeyId: string;
  phone: string;
  timezone: string;
  margin: number;
  batchSize: number;
  status: LegacyLeaderboardForecastStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    unit: string,
    description: string,
    journeyId: string,
    phone: string,
    timezone: string,
    margin: number,
    batchSize: number,
    status: LegacyLeaderboardForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.unit = unit;
    this.description = description;
    this.journeyId = journeyId;
    this.phone = phone;
    this.timezone = timezone;
    this.margin = margin;
    this.batchSize = batchSize;
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

  canMoveTo(next: LegacyLeaderboardForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyLeaderboardForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy leaderboard forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize + this.attempts) * 100) / 100;
  }

  copy(): LegacyLeaderboardForecast {
    return new LegacyLeaderboardForecast(
      this.code,
      this.label,
      this.attempts,
      this.unit,
      this.description,
      this.journeyId,
      this.phone,
      this.timezone,
      this.margin,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy leaderboard forecast in status draft. */
export function newLegacyLeaderboardForecast(code: string, label: string): LegacyLeaderboardForecast {
  return new LegacyLeaderboardForecast(code, label, 0, "", "", "", "", "", 0, 0, "draft");
}
