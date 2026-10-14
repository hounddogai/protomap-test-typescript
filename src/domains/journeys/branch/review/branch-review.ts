/**
 * The branch review records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch review is in its life cycle. */
export type BranchReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a branch review and its current status. */
export class BranchReview {
  code: string;
  label: string;
  discount: number;
  pinned: boolean;
  cohort: string;
  status: BranchReviewStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    pinned: boolean,
    cohort: string,
    status: BranchReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.pinned = pinned;
    this.cohort = cohort;
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

  canMoveTo(next: BranchReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BranchReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): BranchReview {
    return new BranchReview(this.code, this.label, this.discount, this.pinned, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a branch review in status requested. */
export function newBranchReview(code: string, label: string): BranchReview {
  return new BranchReview(code, label, 0, false, "", "requested");
}
