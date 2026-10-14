/**
 * The leaderboard estimate records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard estimate is in its life cycle. */
export type LeaderboardEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A leaderboard estimate. Its code is unique within a tenant. */
export class LeaderboardEstimate {
  code: string;
  label: string;
  windowDays: number;
  timezone: string;
  cohort: string;
  segment: string;
  budget: number;
  utmSource: string;
  checksum: string;
  rate: number;
  attempts: number;
  status: LeaderboardEstimateStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    timezone: string,
    cohort: string,
    segment: string,
    budget: number,
    utmSource: string,
    checksum: string,
    rate: number,
    attempts: number,
    status: LeaderboardEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.timezone = timezone;
    this.cohort = cohort;
    this.segment = segment;
    this.budget = budget;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.rate = rate;
    this.attempts = attempts;
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

  canMoveTo(next: LeaderboardEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LeaderboardEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"leaderboard estimate"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.attempts + this.windowDays) * 100) / 100;
  }

  copy(): LeaderboardEstimate {
    return new LeaderboardEstimate(
      this.code,
      this.label,
      this.windowDays,
      this.timezone,
      this.cohort,
      this.segment,
      this.budget,
      this.utmSource,
      this.checksum,
      this.rate,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a leaderboard estimate in status new. */
export function newLeaderboardEstimate(code: string, label: string): LeaderboardEstimate {
  return new LeaderboardEstimate(code, label, 0, "", "", "", 0, "", "", 0, 0, "new");
}
