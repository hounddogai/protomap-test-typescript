/**
 * The fallback leaderboard policy records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback leaderboard policy is in its life cycle. */
export type FallbackLeaderboardPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback leaderboard policy as the leaderboard team keeps it. */
export class FallbackLeaderboardPolicy {
  code: string;
  name: string;
  windowDays: number;
  budget: number;
  campaignRef: string;
  clicks: number;
  amount: number;
  status: FallbackLeaderboardPolicyStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    budget: number,
    campaignRef: string,
    clicks: number,
    amount: number,
    status: FallbackLeaderboardPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.budget = budget;
    this.campaignRef = campaignRef;
    this.clicks = clicks;
    this.amount = amount;
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

  canMoveTo(next: FallbackLeaderboardPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackLeaderboardPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback leaderboard policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.windowDays + this.budget) * 100) / 100;
  }

  copy(): FallbackLeaderboardPolicy {
    return new FallbackLeaderboardPolicy(
      this.code,
      this.name,
      this.windowDays,
      this.budget,
      this.campaignRef,
      this.clicks,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback leaderboard policy in status requested. */
export function newFallbackLeaderboardPolicy(code: string, name: string): FallbackLeaderboardPolicy {
  return new FallbackLeaderboardPolicy(code, name, 0, 0, "", 0, 0, "requested");
}
