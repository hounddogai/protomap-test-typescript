/**
 * The capped frequency review records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped frequency review is in its life cycle. */
export type CappedFrequencyReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped frequency review as the frequency team keeps it. */
export class CappedFrequencyReview {
  code: string;
  label: string;
  campaignRef: string;
  ratio: number;
  updatedAt: number;
  status: CappedFrequencyReviewStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    ratio: number,
    updatedAt: number,
    status: CappedFrequencyReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFrequencyReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFrequencyReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped frequency review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"capped frequency review"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.ratio - this.updatedAt) * 100) / 100;
  }

  copy(): CappedFrequencyReview {
    return new CappedFrequencyReview(this.code, this.label, this.campaignRef, this.ratio, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped frequency review in status proposed. */
export function newCappedFrequencyReview(code: string, label: string): CappedFrequencyReview {
  return new CappedFrequencyReview(code, label, "", 0, 0, "proposed");
}
