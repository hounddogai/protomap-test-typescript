/**
 * The rolling paywall review records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling paywall review is in its life cycle. */
export type RollingPaywallReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling paywall review as the paywall team keeps it. */
export class RollingPaywallReview {
  code: string;
  title: string;
  journeyId: string;
  cohort: string;
  bid: number;
  visible: boolean;
  contactEmail: string;
  weight: number;
  region: string;
  externalRef: string;
  status: RollingPaywallReviewStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    cohort: string,
    bid: number,
    visible: boolean,
    contactEmail: string,
    weight: number,
    region: string,
    externalRef: string,
    status: RollingPaywallReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.cohort = cohort;
    this.bid = bid;
    this.visible = visible;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.region = region;
    this.externalRef = externalRef;
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

  canMoveTo(next: RollingPaywallReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingPaywallReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling paywall review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.bid + this.weight) * 100) / 100;
  }

  copy(): RollingPaywallReview {
    return new RollingPaywallReview(
      this.code,
      this.title,
      this.journeyId,
      this.cohort,
      this.bid,
      this.visible,
      this.contactEmail,
      this.weight,
      this.region,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling paywall review in status idle. */
export function newRollingPaywallReview(code: string, title: string): RollingPaywallReview {
  return new RollingPaywallReview(code, title, "", "", 0, false, "", 0, "", "", "idle");
}
