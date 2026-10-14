/**
 * The leaderboard milestone records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard milestone is in its life cycle. */
export type LeaderboardMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a leaderboard milestone and its current status. */
export class LeaderboardMilestone {
  code: string;
  label: string;
  budget: number;
  conversionRate: number;
  openRate: number;
  summary: string;
  status: LeaderboardMilestoneStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    conversionRate: number,
    openRate: number,
    summary: string,
    status: LeaderboardMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.openRate = openRate;
    this.summary = summary;
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

  canMoveTo(next: LeaderboardMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LeaderboardMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"leaderboard milestone"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.conversionRate * this.openRate * 100) / 100;
  }

  copy(): LeaderboardMilestone {
    return new LeaderboardMilestone(
      this.code,
      this.label,
      this.budget,
      this.conversionRate,
      this.openRate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard milestone in status draft. */
export function newLeaderboardMilestone(code: string, label: string): LeaderboardMilestone {
  return new LeaderboardMilestone(code, label, 0, 0, 0, "", "draft");
}
