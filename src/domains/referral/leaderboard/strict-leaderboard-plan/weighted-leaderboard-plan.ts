/**
 * The weighted leaderboard plan records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted leaderboard plan is in its life cycle. */
export type WeightedLeaderboardPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One weighted leaderboard plan, with what the planners need to act on it. */
export class WeightedLeaderboardPlan {
  code: string;
  label: string;
  archived: boolean;
  weight: number;
  currency: string;
  variant: string;
  status: WeightedLeaderboardPlanStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    weight: number,
    currency: string,
    variant: string,
    status: WeightedLeaderboardPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.weight = weight;
    this.currency = currency;
    this.variant = variant;
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

  canMoveTo(next: WeightedLeaderboardPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedLeaderboardPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted leaderboard plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): WeightedLeaderboardPlan {
    return new WeightedLeaderboardPlan(
      this.code,
      this.label,
      this.archived,
      this.weight,
      this.currency,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted leaderboard plan in status draft. */
export function newWeightedLeaderboardPlan(code: string, label: string): WeightedLeaderboardPlan {
  return new WeightedLeaderboardPlan(code, label, false, 0, "", "", "draft");
}
