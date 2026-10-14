/**
 * The tiered badge plan records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered badge plan is in its life cycle. */
export type TieredBadgePlanStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a tiered badge plan and its current status. */
export class TieredBadgePlan {
  code: string;
  name: string;
  cost: number;
  cohort: string;
  priority: number;
  attempts: number;
  status: TieredBadgePlanStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    cohort: string,
    priority: number,
    attempts: number,
    status: TieredBadgePlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.cohort = cohort;
    this.priority = priority;
    this.attempts = attempts;
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

  canMoveTo(next: TieredBadgePlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredBadgePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered badge plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered badge plan"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.priority - this.cost) * 100) / 100;
  }

  copy(): TieredBadgePlan {
    return new TieredBadgePlan(this.code, this.name, this.cost, this.cohort, this.priority, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered badge plan in status requested. */
export function newTieredBadgePlan(code: string, name: string): TieredBadgePlan {
  return new TieredBadgePlan(code, name, 0, "", 0, 0, "requested");
}
