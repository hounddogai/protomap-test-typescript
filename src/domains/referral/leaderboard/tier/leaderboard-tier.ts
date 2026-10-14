/**
 * The leaderboard tier records of referral's leaderboard work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard tier is in its life cycle. */
export type LeaderboardTierStatus = "created" | "validated" | "published" | "retired";

/** A leaderboard tier as the leaderboard team keeps it. */
export class LeaderboardTier {
  code: string;
  label: string;
  pinned: boolean;
  version: number;
  cohort: string;
  status: LeaderboardTierStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    version: number,
    cohort: string,
    status: LeaderboardTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.version = version;
    this.cohort = cohort;
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

  canMoveTo(next: LeaderboardTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LeaderboardTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): LeaderboardTier {
    return new LeaderboardTier(this.code, this.label, this.pinned, this.version, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard tier in status created. */
export function newLeaderboardTier(code: string, label: string): LeaderboardTier {
  return new LeaderboardTier(code, label, false, 0, "", "created");
}
