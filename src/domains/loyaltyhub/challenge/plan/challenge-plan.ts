/**
 * The challenge plan records of loyaltyhub's challenge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge plan is in its life cycle. */
export type ChallengePlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a challenge plan and its current status. */
export class ChallengePlan {
  code: string;
  name: string;
  currency: string;
  ratio: number;
  expiresAt: number;
  status: ChallengePlanStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    ratio: number,
    expiresAt: number,
    status: ChallengePlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengePlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ChallengePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"challenge plan"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.expiresAt - this.ratio) * 100) / 100;
  }

  copy(): ChallengePlan {
    return new ChallengePlan(this.code, this.name, this.currency, this.ratio, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a challenge plan in status planned. */
export function newChallengePlan(code: string, name: string): ChallengePlan {
  return new ChallengePlan(code, name, "", 0, 0, "planned");
}
