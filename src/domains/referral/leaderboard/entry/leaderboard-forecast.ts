import * as text from "../../../../kit/text.js";

/** Where a leaderboard forecast is in its life cycle. */
export type LeaderboardForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** One leaderboard forecast, with what the planners need to act on it. */
export class LeaderboardForecast {
  code: string;
  label: string;
  budget: number;
  locale: string;
  version: number;
  channel: string;
  reviewer: string;
  clicks: number;
  bid: number;
  archived: boolean;
  rate: number;
  status: LeaderboardForecastStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    locale: string,
    version: number,
    channel: string,
    reviewer: string,
    clicks: number,
    bid: number,
    archived: boolean,
    rate: number,
    status: LeaderboardForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.locale = locale;
    this.version = version;
    this.channel = channel;
    this.reviewer = reviewer;
    this.clicks = clicks;
    this.bid = bid;
    this.archived = archived;
    this.rate = rate;
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

  canMoveTo(next: LeaderboardForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.version - this.rate) * 100) / 100;
  }

  copy(): LeaderboardForecast {
    return new LeaderboardForecast(
      this.code,
      this.label,
      this.budget,
      this.locale,
      this.version,
      this.channel,
      this.reviewer,
      this.clicks,
      this.bid,
      this.archived,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a leaderboard forecast in status new. */
export function newLeaderboardForecast(code: string, label: string): LeaderboardForecast {
  return new LeaderboardForecast(code, label, 0, "", 0, "", "", 0, 0, false, 0, "new");
}
