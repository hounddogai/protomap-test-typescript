/**
 * The rolling opt out review records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling opt out review is in its life cycle. */
export type RollingOptOutReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a rolling opt out review and its current status. */
export class RollingOptOutReview {
  code: string;
  title: string;
  approved: boolean;
  externalRef: string;
  discount: number;
  quantity: number;
  segment: string;
  maximum: number;
  region: string;
  contactEmail: string;
  status: RollingOptOutReviewStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    externalRef: string,
    discount: number,
    quantity: number,
    segment: string,
    maximum: number,
    region: string,
    contactEmail: string,
    status: RollingOptOutReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.externalRef = externalRef;
    this.discount = discount;
    this.quantity = quantity;
    this.segment = segment;
    this.maximum = maximum;
    this.region = region;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingOptOutReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingOptOutReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling opt out review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round(this.discount * this.maximum * 100) / 100;
  }

  copy(): RollingOptOutReview {
    return new RollingOptOutReview(
      this.code,
      this.title,
      this.approved,
      this.externalRef,
      this.discount,
      this.quantity,
      this.segment,
      this.maximum,
      this.region,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling opt out review in status new. */
export function newRollingOptOutReview(code: string, title: string): RollingOptOutReview {
  return new RollingOptOutReview(code, title, false, "", 0, 0, "", 0, "", "", "new");
}
