/**
 * The scheduled leaderboard override records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled leaderboard override is in its life cycle. */
export type ScheduledLeaderboardOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled leaderboard override, with what the planners need to act on it. */
export class ScheduledLeaderboardOverride {
  code: string;
  title: string;
  ceiling: number;
  minimum: number;
  expiresAt: number;
  source: string;
  tags: string[];
  quantity: number;
  active: boolean;
  windowDays: number;
  status: ScheduledLeaderboardOverrideStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    minimum: number,
    expiresAt: number,
    source: string,
    tags: string[],
    quantity: number,
    active: boolean,
    windowDays: number,
    status: ScheduledLeaderboardOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.source = source;
    this.tags = tags;
    this.quantity = quantity;
    this.active = active;
    this.windowDays = windowDays;
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

  canMoveTo(next: ScheduledLeaderboardOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledLeaderboardOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled leaderboard override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.windowDays - this.quantity) * 100) / 100;
  }

  copy(): ScheduledLeaderboardOverride {
    return new ScheduledLeaderboardOverride(
      this.code,
      this.title,
      this.ceiling,
      this.minimum,
      this.expiresAt,
      this.source,
      this.tags,
      this.quantity,
      this.active,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled leaderboard override in status open. */
export function newScheduledLeaderboardOverride(code: string, title: string): ScheduledLeaderboardOverride {
  return new ScheduledLeaderboardOverride(code, title, 0, 0, 0, "", [], 0, false, 0, "open");
}
