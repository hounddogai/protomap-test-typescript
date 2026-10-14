/**
 * The leaderboard notice records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard notice is in its life cycle. */
export type LeaderboardNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One leaderboard notice, with what the planners need to act on it. */
export class LeaderboardNotice {
  code: string;
  label: string;
  minimum: number;
  campaignRef: string;
  budget: number;
  reviewer: string;
  phone: string;
  sendAt: number;
  currency: string;
  status: LeaderboardNoticeStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    campaignRef: string,
    budget: number,
    reviewer: string,
    phone: string,
    sendAt: number,
    currency: string,
    status: LeaderboardNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.reviewer = reviewer;
    this.phone = phone;
    this.sendAt = sendAt;
    this.currency = currency;
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

  canMoveTo(next: LeaderboardNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.budget - this.sendAt) * 100) / 100;
  }

  copy(): LeaderboardNotice {
    return new LeaderboardNotice(
      this.code,
      this.label,
      this.minimum,
      this.campaignRef,
      this.budget,
      this.reviewer,
      this.phone,
      this.sendAt,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard notice in status draft. */
export function newLeaderboardNotice(code: string, label: string): LeaderboardNotice {
  return new LeaderboardNotice(code, label, 0, "", 0, "", "", 0, "", "draft");
}
