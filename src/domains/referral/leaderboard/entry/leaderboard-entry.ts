/**
 * The leaderboard entry records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard entry is in its life cycle. */
export type LeaderboardEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A leaderboard entry. Its code is unique within a tenant. */
export class LeaderboardEntry {
  code: string;
  label: string;
  bid: number;
  reviewer: string;
  cost: number;
  limit: number;
  priority: number;
  source: string;
  visible: boolean;
  status: LeaderboardEntryStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    reviewer: string,
    cost: number,
    limit: number,
    priority: number,
    source: string,
    visible: boolean,
    status: LeaderboardEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.reviewer = reviewer;
    this.cost = cost;
    this.limit = limit;
    this.priority = priority;
    this.source = source;
    this.visible = visible;
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

  canMoveTo(next: LeaderboardEntryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.cost + this.limit) * 100) / 100;
  }

  copy(): LeaderboardEntry {
    return new LeaderboardEntry(
      this.code,
      this.label,
      this.bid,
      this.reviewer,
      this.cost,
      this.limit,
      this.priority,
      this.source,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a leaderboard entry in status new. */
export function newLeaderboardEntry(code: string, label: string): LeaderboardEntry {
  return new LeaderboardEntry(code, label, 0, "", 0, 0, 0, "", false, "new");
}
