/**
 * The lenient enrollment digest records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient enrollment digest is in its life cycle. */
export type LenientEnrollmentDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient enrollment digest as the enrollment team keeps it. */
export class LenientEnrollmentDigest {
  code: string;
  label: string;
  contactEmail: string;
  discount: number;
  durationMinutes: number;
  threshold: number;
  status: LenientEnrollmentDigestStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    discount: number,
    durationMinutes: number,
    threshold: number,
    status: LenientEnrollmentDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.discount = discount;
    this.durationMinutes = durationMinutes;
    this.threshold = threshold;
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

  canMoveTo(next: LenientEnrollmentDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientEnrollmentDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient enrollment digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient enrollment digest"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.threshold * this.discount * 100) / 100;
  }

  copy(): LenientEnrollmentDigest {
    return new LenientEnrollmentDigest(
      this.code,
      this.label,
      this.contactEmail,
      this.discount,
      this.durationMinutes,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient enrollment digest in status proposed. */
export function newLenientEnrollmentDigest(code: string, label: string): LenientEnrollmentDigest {
  return new LenientEnrollmentDigest(code, label, "", 0, 0, 0, "proposed");
}
