/**
 * The lenient journey policy records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient journey policy is in its life cycle. */
export type LenientJourneyPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a lenient journey policy and its current status. */
export class LenientJourneyPolicy {
  code: string;
  label: string;
  retries: number;
  notes: string;
  utmSource: string;
  limit: number;
  status: LenientJourneyPolicyStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    notes: string,
    utmSource: string,
    limit: number,
    status: LenientJourneyPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.notes = notes;
    this.utmSource = utmSource;
    this.limit = limit;
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

  canMoveTo(next: LenientJourneyPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientJourneyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient journey policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.retries - this.limit) * 100) / 100;
  }

  copy(): LenientJourneyPolicy {
    return new LenientJourneyPolicy(
      this.code,
      this.label,
      this.retries,
      this.notes,
      this.utmSource,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient journey policy in status requested. */
export function newLenientJourneyPolicy(code: string, label: string): LenientJourneyPolicy {
  return new LenientJourneyPolicy(code, label, 0, "", "", 0, "requested");
}
