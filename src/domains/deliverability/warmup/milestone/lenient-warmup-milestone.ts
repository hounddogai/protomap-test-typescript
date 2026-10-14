/**
 * The lenient warmup milestone records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient warmup milestone is in its life cycle. */
export type LenientWarmupMilestoneStatus = "created" | "validated" | "published" | "retired";

/** A lenient warmup milestone as the warmup team keeps it. */
export class LenientWarmupMilestone {
  code: string;
  name: string;
  externalRef: string;
  visible: boolean;
  rate: number;
  bid: number;
  discount: number;
  status: LenientWarmupMilestoneStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    visible: boolean,
    rate: number,
    bid: number,
    discount: number,
    status: LenientWarmupMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.visible = visible;
    this.rate = rate;
    this.bid = bid;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientWarmupMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientWarmupMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient warmup milestone"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.discount - this.bid) * 100) / 100;
  }

  copy(): LenientWarmupMilestone {
    return new LenientWarmupMilestone(
      this.code,
      this.name,
      this.externalRef,
      this.visible,
      this.rate,
      this.bid,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient warmup milestone in status created. */
export function newLenientWarmupMilestone(code: string, name: string): LenientWarmupMilestone {
  return new LenientWarmupMilestone(code, name, "", false, 0, 0, 0, "created");
}
