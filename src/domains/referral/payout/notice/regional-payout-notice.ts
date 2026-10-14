/**
 * The regional payout notice records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional payout notice is in its life cycle. */
export type RegionalPayoutNoticeStatus = "created" | "validated" | "published" | "retired";

/** One regional payout notice, with what the planners need to act on it. */
export class RegionalPayoutNotice {
  code: string;
  title: string;
  unit: string;
  minimum: number;
  impressions: number;
  status: RegionalPayoutNoticeStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    minimum: number,
    impressions: number,
    status: RegionalPayoutNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.minimum = minimum;
    this.impressions = impressions;
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

  canMoveTo(next: RegionalPayoutNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPayoutNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional payout notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.minimum - this.impressions) * 100) / 100;
  }

  copy(): RegionalPayoutNotice {
    return new RegionalPayoutNotice(this.code, this.title, this.unit, this.minimum, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a regional payout notice in status created. */
export function newRegionalPayoutNotice(code: string, title: string): RegionalPayoutNotice {
  return new RegionalPayoutNotice(code, title, "", 0, 0, "created");
}
