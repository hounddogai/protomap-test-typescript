/**
 * The branch tier records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch tier is in its life cycle. */
export type BranchTierStatus = "requested" | "granted" | "revoked" | "expired";

/** A branch tier as the branch team keeps it. */
export class BranchTier {
  code: string;
  name: string;
  category: string;
  budget: number;
  startsAt: number;
  status: BranchTierStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    budget: number,
    startsAt: number,
    status: BranchTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.budget = budget;
    this.startsAt = startsAt;
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

  canMoveTo(next: BranchTierStatus): boolean {
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

  moveTo(next: BranchTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round((this.startsAt - this.budget) * 100) / 100;
  }

  copy(): BranchTier {
    return new BranchTier(this.code, this.name, this.category, this.budget, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a branch tier in status requested. */
export function newBranchTier(code: string, name: string): BranchTier {
  return new BranchTier(code, name, "", 0, 0, "requested");
}
