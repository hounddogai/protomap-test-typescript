/**
 * The pending activation review records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending activation review is in its life cycle. */
export type PendingActivationReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending activation review as the activation team keeps it. */
export class PendingActivationReview {
  code: string;
  title: string;
  threshold: number;
  rate: number;
  bid: number;
  contactEmail: string;
  sendAt: number;
  updatedAt: number;
  segment: string;
  status: PendingActivationReviewStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    rate: number,
    bid: number,
    contactEmail: string,
    sendAt: number,
    updatedAt: number,
    segment: string,
    status: PendingActivationReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.rate = rate;
    this.bid = bid;
    this.contactEmail = contactEmail;
    this.sendAt = sendAt;
    this.updatedAt = updatedAt;
    this.segment = segment;
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

  canMoveTo(next: PendingActivationReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: PendingActivationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending activation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.threshold - this.bid) * 100) / 100;
  }

  copy(): PendingActivationReview {
    return new PendingActivationReview(
      this.code,
      this.title,
      this.threshold,
      this.rate,
      this.bid,
      this.contactEmail,
      this.sendAt,
      this.updatedAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending activation review in status proposed. */
export function newPendingActivationReview(code: string, title: string): PendingActivationReview {
  return new PendingActivationReview(code, title, 0, 0, 0, "", 0, 0, "", "proposed");
}
