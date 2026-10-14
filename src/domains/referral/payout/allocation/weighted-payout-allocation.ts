/**
 * The weighted payout allocation records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted payout allocation is in its life cycle. */
export type WeightedPayoutAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted payout allocation and its current status. */
export class WeightedPayoutAllocation {
  code: string;
  name: string;
  bid: number;
  graceDays: number;
  externalRef: string;
  rate: number;
  source: string;
  capacity: number;
  sequence: number;
  locale: string;
  status: WeightedPayoutAllocationStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    graceDays: number,
    externalRef: string,
    rate: number,
    source: string,
    capacity: number,
    sequence: number,
    locale: string,
    status: WeightedPayoutAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
    this.rate = rate;
    this.source = source;
    this.capacity = capacity;
    this.sequence = sequence;
    this.locale = locale;
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

  canMoveTo(next: WeightedPayoutAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPayoutAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted payout allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.capacity - this.graceDays) * 100) / 100;
  }

  copy(): WeightedPayoutAllocation {
    return new WeightedPayoutAllocation(
      this.code,
      this.name,
      this.bid,
      this.graceDays,
      this.externalRef,
      this.rate,
      this.source,
      this.capacity,
      this.sequence,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted payout allocation in status planned. */
export function newWeightedPayoutAllocation(code: string, name: string): WeightedPayoutAllocation {
  return new WeightedPayoutAllocation(code, name, 0, 0, "", 0, "", 0, 0, "", "planned");
}
