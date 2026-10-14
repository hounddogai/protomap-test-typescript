/**
 * The legacy leaderboard review records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy leaderboard review is in its life cycle. */
export type LegacyLeaderboardReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy leaderboard review as the leaderboard team keeps it. */
export class LegacyLeaderboardReview {
  code: string;
  title: string;
  cohort: string;
  discount: number;
  durationMinutes: number;
  variant: string;
  retries: number;
  windowDays: number;
  budget: number;
  sendAt: number;
  openRate: number;
  status: LegacyLeaderboardReviewStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    discount: number,
    durationMinutes: number,
    variant: string,
    retries: number,
    windowDays: number,
    budget: number,
    sendAt: number,
    openRate: number,
    status: LegacyLeaderboardReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.discount = discount;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.retries = retries;
    this.windowDays = windowDays;
    this.budget = budget;
    this.sendAt = sendAt;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyLeaderboardReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyLeaderboardReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy leaderboard review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy leaderboard review"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.durationMinutes - this.openRate) * 100) / 100;
  }

  copy(): LegacyLeaderboardReview {
    return new LegacyLeaderboardReview(
      this.code,
      this.title,
      this.cohort,
      this.discount,
      this.durationMinutes,
      this.variant,
      this.retries,
      this.windowDays,
      this.budget,
      this.sendAt,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy leaderboard review in status requested. */
export function newLegacyLeaderboardReview(code: string, title: string): LegacyLeaderboardReview {
  return new LegacyLeaderboardReview(code, title, "", 0, 0, "", 0, 0, 0, 0, 0, "requested");
}
