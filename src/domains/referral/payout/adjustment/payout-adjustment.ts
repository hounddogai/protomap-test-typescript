/**
 * The payout adjustment records of referral's payout work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout adjustment is in its life cycle. */
export type PayoutAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A payout adjustment. Its code is unique within a tenant. */
export class PayoutAdjustment {
  code: string;
  name: string;
  ownerId: string;
  active: boolean;
  ceiling: number;
  status: PayoutAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    active: boolean,
    ceiling: number,
    status: PayoutAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.active = active;
    this.ceiling = ceiling;
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

  canMoveTo(next: PayoutAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): PayoutAdjustment {
    return new PayoutAdjustment(this.code, this.name, this.ownerId, this.active, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout adjustment in status planned. */
export function newPayoutAdjustment(code: string, name: string): PayoutAdjustment {
  return new PayoutAdjustment(code, name, "", false, 0, "planned");
}
