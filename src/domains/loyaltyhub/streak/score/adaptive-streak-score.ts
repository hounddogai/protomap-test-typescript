/**
 * The adaptive streak score records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive streak score is in its life cycle. */
export type AdaptiveStreakScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive streak score as the streak team keeps it. */
export class AdaptiveStreakScore {
  code: string;
  name: string;
  limit: number;
  discount: number;
  windowDays: number;
  description: string;
  approved: boolean;
  cost: number;
  status: AdaptiveStreakScoreStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    discount: number,
    windowDays: number,
    description: string,
    approved: boolean,
    cost: number,
    status: AdaptiveStreakScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.discount = discount;
    this.windowDays = windowDays;
    this.description = description;
    this.approved = approved;
    this.cost = cost;
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

  canMoveTo(next: AdaptiveStreakScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: AdaptiveStreakScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive streak score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round(this.windowDays * this.limit * 100) / 100;
  }

  copy(): AdaptiveStreakScore {
    return new AdaptiveStreakScore(
      this.code,
      this.name,
      this.limit,
      this.discount,
      this.windowDays,
      this.description,
      this.approved,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive streak score in status requested. */
export function newAdaptiveStreakScore(code: string, name: string): AdaptiveStreakScore {
  return new AdaptiveStreakScore(code, name, 0, 0, 0, "", false, 0, "requested");
}
