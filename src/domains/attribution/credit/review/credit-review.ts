/**
 * The credit review records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit review is in its life cycle. */
export type CreditReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One credit review, with what the planners need to act on it. */
export class CreditReview {
  code: string;
  label: string;
  retries: number;
  campaignRef: string;
  quantity: number;
  variant: string;
  status: CreditReviewStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    campaignRef: string,
    quantity: number,
    variant: string,
    status: CreditReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.quantity - this.retries) * 100) / 100;
  }

  copy(): CreditReview {
    return new CreditReview(
      this.code,
      this.label,
      this.retries,
      this.campaignRef,
      this.quantity,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a credit review in status idle. */
export function newCreditReview(code: string, label: string): CreditReview {
  return new CreditReview(code, label, 0, "", 0, "", "idle");
}
