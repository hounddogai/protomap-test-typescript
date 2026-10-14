/**
 * The manual leaderboard adjustment records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual leaderboard adjustment is in its life cycle. */
export type ManualLeaderboardAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual leaderboard adjustment as the leaderboard team keeps it. */
export class ManualLeaderboardAdjustment {
  code: string;
  title: string;
  pinned: boolean;
  capacity: number;
  currency: string;
  amount: number;
  locale: string;
  budget: number;
  ceiling: number;
  externalRef: string;
  country: string;
  status: ManualLeaderboardAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    capacity: number,
    currency: string,
    amount: number,
    locale: string,
    budget: number,
    ceiling: number,
    externalRef: string,
    country: string,
    status: ManualLeaderboardAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.capacity = capacity;
    this.currency = currency;
    this.amount = amount;
    this.locale = locale;
    this.budget = budget;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
    this.country = country;
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

  canMoveTo(next: ManualLeaderboardAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualLeaderboardAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual leaderboard adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.capacity * this.budget * 100) / 100;
  }

  copy(): ManualLeaderboardAdjustment {
    return new ManualLeaderboardAdjustment(
      this.code,
      this.title,
      this.pinned,
      this.capacity,
      this.currency,
      this.amount,
      this.locale,
      this.budget,
      this.ceiling,
      this.externalRef,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual leaderboard adjustment in status idle. */
export function newManualLeaderboardAdjustment(code: string, title: string): ManualLeaderboardAdjustment {
  return new ManualLeaderboardAdjustment(code, title, false, 0, "", 0, "", 0, 0, "", "", "idle");
}
