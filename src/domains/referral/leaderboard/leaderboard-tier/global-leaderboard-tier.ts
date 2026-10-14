/**
 * The global leaderboard tier records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global leaderboard tier is in its life cycle. */
export type GlobalLeaderboardTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global leaderboard tier and its current status. */
export class GlobalLeaderboardTier {
  code: string;
  label: string;
  batchSize: number;
  rate: number;
  windowDays: number;
  tags: string[];
  sendAt: number;
  threshold: number;
  amount: number;
  status: GlobalLeaderboardTierStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    rate: number,
    windowDays: number,
    tags: string[],
    sendAt: number,
    threshold: number,
    amount: number,
    status: GlobalLeaderboardTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.rate = rate;
    this.windowDays = windowDays;
    this.tags = tags;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.amount = amount;
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

  canMoveTo(next: GlobalLeaderboardTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalLeaderboardTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global leaderboard tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global leaderboard tier"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round(this.sendAt * this.windowDays * 100) / 100;
  }

  copy(): GlobalLeaderboardTier {
    return new GlobalLeaderboardTier(
      this.code,
      this.label,
      this.batchSize,
      this.rate,
      this.windowDays,
      this.tags,
      this.sendAt,
      this.threshold,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global leaderboard tier in status draft. */
export function newGlobalLeaderboardTier(code: string, label: string): GlobalLeaderboardTier {
  return new GlobalLeaderboardTier(code, label, 0, 0, 0, [], 0, 0, 0, "draft");
}
