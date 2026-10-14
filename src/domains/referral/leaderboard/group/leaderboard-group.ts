/**
 * The leaderboard group records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard group is in its life cycle. */
export type LeaderboardGroupStatus = "created" | "validated" | "published" | "retired";

/** A leaderboard group as the leaderboard team keeps it. */
export class LeaderboardGroup {
  code: string;
  label: string;
  bid: number;
  impressions: number;
  quantity: number;
  checksum: string;
  status: LeaderboardGroupStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    impressions: number,
    quantity: number,
    checksum: string,
    status: LeaderboardGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.impressions = impressions;
    this.quantity = quantity;
    this.checksum = checksum;
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

  canMoveTo(next: LeaderboardGroupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round(this.impressions * this.quantity * 100) / 100;
  }

  copy(): LeaderboardGroup {
    return new LeaderboardGroup(
      this.code,
      this.label,
      this.bid,
      this.impressions,
      this.quantity,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard group in status created. */
export function newLeaderboardGroup(code: string, label: string): LeaderboardGroup {
  return new LeaderboardGroup(code, label, 0, 0, 0, "", "created");
}
