/**
 * The weighted tier allocation records of referral's tier work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted tier allocation is in its life cycle. */
export type WeightedTierAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One weighted tier allocation, with what the planners need to act on it. */
export class WeightedTierAllocation {
  code: string;
  label: string;
  sendAt: number;
  ratio: number;
  updatedAt: number;
  status: WeightedTierAllocationStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    ratio: number,
    updatedAt: number,
    status: WeightedTierAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: WeightedTierAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
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

  moveTo(next: WeightedTierAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted tier allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round((this.updatedAt + this.ratio) * 100) / 100;
  }

  copy(): WeightedTierAllocation {
    return new WeightedTierAllocation(this.code, this.label, this.sendAt, this.ratio, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted tier allocation in status draft. */
export function newWeightedTierAllocation(code: string, label: string): WeightedTierAllocation {
  return new WeightedTierAllocation(code, label, 0, 0, 0, "draft");
}
