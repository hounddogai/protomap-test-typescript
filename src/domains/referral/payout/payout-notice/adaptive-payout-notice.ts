/**
 * The adaptive payout notice records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive payout notice is in its life cycle. */
export type AdaptivePayoutNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive payout notice as the payout team keeps it. */
export class AdaptivePayoutNotice {
  code: string;
  label: string;
  minimum: number;
  cohort: string;
  campaignRef: string;
  status: AdaptivePayoutNoticeStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    cohort: string,
    campaignRef: string,
    status: AdaptivePayoutNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.cohort = cohort;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptivePayoutNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptivePayoutNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive payout notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): AdaptivePayoutNotice {
    return new AdaptivePayoutNotice(this.code, this.label, this.minimum, this.cohort, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive payout notice in status open. */
export function newAdaptivePayoutNotice(code: string, label: string): AdaptivePayoutNotice {
  return new AdaptivePayoutNotice(code, label, 0, "", "", "open");
}
