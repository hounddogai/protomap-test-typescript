/**
 * The leaderboard adjustment records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard adjustment is in its life cycle. */
export type LeaderboardAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a leaderboard adjustment and its current status. */
export class LeaderboardAdjustment {
  code: string;
  label: string;
  archived: boolean;
  threshold: number;
  score: number;
  journeyId: string;
  campaignRef: string;
  status: LeaderboardAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    threshold: number,
    score: number,
    journeyId: string,
    campaignRef: string,
    status: LeaderboardAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.threshold = threshold;
    this.score = score;
    this.journeyId = journeyId;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: LeaderboardAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LeaderboardAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.score + this.threshold) * 100) / 100;
  }

  copy(): LeaderboardAdjustment {
    return new LeaderboardAdjustment(
      this.code,
      this.label,
      this.archived,
      this.threshold,
      this.score,
      this.journeyId,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard adjustment in status idle. */
export function newLeaderboardAdjustment(code: string, label: string): LeaderboardAdjustment {
  return new LeaderboardAdjustment(code, label, false, 0, 0, "", "", "idle");
}
