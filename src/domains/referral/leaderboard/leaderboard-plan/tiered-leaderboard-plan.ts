/**
 * The tiered leaderboard plan records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered leaderboard plan is in its life cycle. */
export type TieredLeaderboardPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered leaderboard plan as the leaderboard team keeps it. */
export class TieredLeaderboardPlan {
  code: string;
  name: string;
  score: number;
  timezone: string;
  impressions: number;
  expiresAt: number;
  pinned: boolean;
  externalRef: string;
  channel: string;
  country: string;
  locale: string;
  status: TieredLeaderboardPlanStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    timezone: string,
    impressions: number,
    expiresAt: number,
    pinned: boolean,
    externalRef: string,
    channel: string,
    country: string,
    locale: string,
    status: TieredLeaderboardPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.timezone = timezone;
    this.impressions = impressions;
    this.expiresAt = expiresAt;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.channel = channel;
    this.country = country;
    this.locale = locale;
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

  canMoveTo(next: TieredLeaderboardPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredLeaderboardPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered leaderboard plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt - this.impressions) * 100) / 100;
  }

  copy(): TieredLeaderboardPlan {
    return new TieredLeaderboardPlan(
      this.code,
      this.name,
      this.score,
      this.timezone,
      this.impressions,
      this.expiresAt,
      this.pinned,
      this.externalRef,
      this.channel,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered leaderboard plan in status open. */
export function newTieredLeaderboardPlan(code: string, name: string): TieredLeaderboardPlan {
  return new TieredLeaderboardPlan(code, name, 0, "", 0, 0, false, "", "", "", "", "open");
}
