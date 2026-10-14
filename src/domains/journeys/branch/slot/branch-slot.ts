/**
 * The branch slot records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch slot is in its life cycle. */
export type BranchSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** One branch slot, with what the planners need to act on it. */
export class BranchSlot {
  code: string;
  name: string;
  ratio: number;
  active: boolean;
  bid: number;
  openRate: number;
  conversionRate: number;
  status: BranchSlotStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    active: boolean,
    bid: number,
    openRate: number,
    conversionRate: number,
    status: BranchSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.active = active;
    this.bid = bid;
    this.openRate = openRate;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: BranchSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BranchSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.bid - this.conversionRate) * 100) / 100;
  }

  copy(): BranchSlot {
    return new BranchSlot(
      this.code,
      this.name,
      this.ratio,
      this.active,
      this.bid,
      this.openRate,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a branch slot in status requested. */
export function newBranchSlot(code: string, name: string): BranchSlot {
  return new BranchSlot(code, name, 0, false, 0, 0, 0, "requested");
}
