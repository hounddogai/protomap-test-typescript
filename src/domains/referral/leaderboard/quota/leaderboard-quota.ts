/**
 * The leaderboard quota records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard quota is in its life cycle. */
export type LeaderboardQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One leaderboard quota, with what the planners need to act on it. */
export class LeaderboardQuota {
  code: string;
  label: string;
  limit: number;
  segment: string;
  minimum: number;
  floorValue: number;
  quantity: number;
  channel: string;
  category: string;
  status: LeaderboardQuotaStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    segment: string,
    minimum: number,
    floorValue: number,
    quantity: number,
    channel: string,
    category: string,
    status: LeaderboardQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.segment = segment;
    this.minimum = minimum;
    this.floorValue = floorValue;
    this.quantity = quantity;
    this.channel = channel;
    this.category = category;
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

  canMoveTo(next: LeaderboardQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LeaderboardQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.quantity * this.limit * 100) / 100;
  }

  copy(): LeaderboardQuota {
    return new LeaderboardQuota(
      this.code,
      this.label,
      this.limit,
      this.segment,
      this.minimum,
      this.floorValue,
      this.quantity,
      this.channel,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a leaderboard quota in status draft. */
export function newLeaderboardQuota(code: string, label: string): LeaderboardQuota {
  return new LeaderboardQuota(code, label, 0, "", 0, 0, 0, "", "", "draft");
}
