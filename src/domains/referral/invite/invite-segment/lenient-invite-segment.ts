/**
 * The lenient invite segment records of referral's invite work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient invite segment is in its life cycle. */
export type LenientInviteSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient invite segment as the invite team keeps it. */
export class LenientInviteSegment {
  code: string;
  name: string;
  unit: string;
  journeyId: string;
  title: string;
  threshold: number;
  campaignRef: string;
  sequence: number;
  locale: string;
  status: LenientInviteSegmentStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    journeyId: string,
    title: string,
    threshold: number,
    campaignRef: string,
    sequence: number,
    locale: string,
    status: LenientInviteSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.journeyId = journeyId;
    this.title = title;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.sequence = sequence;
    this.locale = locale;
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

  canMoveTo(next: LenientInviteSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LenientInviteSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient invite segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient invite segment"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.sequence + this.threshold) * 100) / 100;
  }

  copy(): LenientInviteSegment {
    return new LenientInviteSegment(
      this.code,
      this.name,
      this.unit,
      this.journeyId,
      this.title,
      this.threshold,
      this.campaignRef,
      this.sequence,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient invite segment in status requested. */
export function newLenientInviteSegment(code: string, name: string): LenientInviteSegment {
  return new LenientInviteSegment(code, name, "", "", "", 0, "", 0, "", "requested");
}
