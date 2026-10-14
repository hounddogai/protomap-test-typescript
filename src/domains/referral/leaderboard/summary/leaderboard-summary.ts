/**
 * The leaderboard summary records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard summary is in its life cycle. */
export type LeaderboardSummaryStatus = "created" | "validated" | "published" | "retired";

/** One leaderboard summary, with what the planners need to act on it. */
export class LeaderboardSummary {
  code: string;
  label: string;
  description: string;
  version: number;
  createdAt: number;
  capacity: number;
  status: LeaderboardSummaryStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    version: number,
    createdAt: number,
    capacity: number,
    status: LeaderboardSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.version = version;
    this.createdAt = createdAt;
    this.capacity = capacity;
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

  canMoveTo(next: LeaderboardSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round((this.version - this.createdAt) * 100) / 100;
  }

  copy(): LeaderboardSummary {
    return new LeaderboardSummary(
      this.code,
      this.label,
      this.description,
      this.version,
      this.createdAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard summary in status created. */
export function newLeaderboardSummary(code: string, label: string): LeaderboardSummary {
  return new LeaderboardSummary(code, label, "", 0, 0, 0, "created");
}
