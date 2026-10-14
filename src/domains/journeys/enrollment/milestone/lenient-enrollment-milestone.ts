/**
 * The lenient enrollment milestone records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient enrollment milestone is in its life cycle. */
export type LenientEnrollmentMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One lenient enrollment milestone, with what the planners need to act on it. */
export class LenientEnrollmentMilestone {
  code: string;
  label: string;
  amount: number;
  sequence: number;
  threshold: number;
  clicks: number;
  bid: number;
  startsAt: number;
  country: string;
  status: LenientEnrollmentMilestoneStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    sequence: number,
    threshold: number,
    clicks: number,
    bid: number,
    startsAt: number,
    country: string,
    status: LenientEnrollmentMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.sequence = sequence;
    this.threshold = threshold;
    this.clicks = clicks;
    this.bid = bid;
    this.startsAt = startsAt;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientEnrollmentMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientEnrollmentMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient enrollment milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.clicks + this.sequence) * 100) / 100;
  }

  copy(): LenientEnrollmentMilestone {
    return new LenientEnrollmentMilestone(
      this.code,
      this.label,
      this.amount,
      this.sequence,
      this.threshold,
      this.clicks,
      this.bid,
      this.startsAt,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a lenient enrollment milestone in status draft. */
export function newLenientEnrollmentMilestone(code: string, label: string): LenientEnrollmentMilestone {
  return new LenientEnrollmentMilestone(code, label, 0, 0, 0, 0, 0, 0, "", "draft");
}
