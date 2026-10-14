import * as text from "../../../../kit/text.js";

/** Where a seasonal leaderboard rollup is in its life cycle. */
export type SeasonalLeaderboardRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a seasonal leaderboard rollup and its current status. */
export class SeasonalLeaderboardRollup {
  code: string;
  title: string;
  country: string;
  timezone: string;
  batchSize: number;
  status: SeasonalLeaderboardRollupStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    timezone: string,
    batchSize: number,
    status: SeasonalLeaderboardRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.timezone = timezone;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalLeaderboardRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalLeaderboardRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal leaderboard rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): SeasonalLeaderboardRollup {
    return new SeasonalLeaderboardRollup(
      this.code,
      this.title,
      this.country,
      this.timezone,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal leaderboard rollup in status proposed. */
export function newSeasonalLeaderboardRollup(code: string, title: string): SeasonalLeaderboardRollup {
  return new SeasonalLeaderboardRollup(code, title, "", "", 0, "proposed");
}
