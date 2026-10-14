import * as text from "../../../../kit/text.js";

/** Where a leaderboard window is in its life cycle. */
export type LeaderboardWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A leaderboard window. Its code is unique within a tenant. */
export class LeaderboardWindow {
  code: string;
  name: string;
  retries: number;
  country: string;
  clicks: number;
  ceiling: number;
  threshold: number;
  source: string;
  utmSource: string;
  description: string;
  quantity: number;
  status: LeaderboardWindowStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    country: string,
    clicks: number,
    ceiling: number,
    threshold: number,
    source: string,
    utmSource: string,
    description: string,
    quantity: number,
    status: LeaderboardWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.country = country;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.threshold = threshold;
    this.source = source;
    this.utmSource = utmSource;
    this.description = description;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LeaderboardWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"leaderboard window"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.ceiling + this.clicks) * 100) / 100;
  }

  copy(): LeaderboardWindow {
    return new LeaderboardWindow(
      this.code,
      this.name,
      this.retries,
      this.country,
      this.clicks,
      this.ceiling,
      this.threshold,
      this.source,
      this.utmSource,
      this.description,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a leaderboard window in status idle. */
export function newLeaderboardWindow(code: string, name: string): LeaderboardWindow {
  return new LeaderboardWindow(code, name, 0, "", 0, 0, 0, "", "", "", 0, "idle");
}
