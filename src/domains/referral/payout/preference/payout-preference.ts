/**
 * The payout preference records of referral's payout work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout preference is in its life cycle. */
export type PayoutPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A payout preference as the payout team keeps it. */
export class PayoutPreference {
  code: string;
  title: string;
  ratio: number;
  batchSize: number;
  endsAt: number;
  status: PayoutPreferenceStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    batchSize: number,
    endsAt: number,
    status: PayoutPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.batchSize = batchSize;
    this.endsAt = endsAt;
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

  canMoveTo(next: PayoutPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.ratio + this.batchSize) * 100) / 100;
  }

  copy(): PayoutPreference {
    return new PayoutPreference(this.code, this.title, this.ratio, this.batchSize, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a payout preference in status open. */
export function newPayoutPreference(code: string, title: string): PayoutPreference {
  return new PayoutPreference(code, title, 0, 0, 0, "open");
}
