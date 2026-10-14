/**
 * The enrollment baseline records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment baseline is in its life cycle. */
export type EnrollmentBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One enrollment baseline, with what the planners need to act on it. */
export class EnrollmentBaseline {
  code: string;
  title: string;
  threshold: number;
  conversionRate: number;
  checksum: string;
  country: string;
  quantity: number;
  sendAt: number;
  version: number;
  windowDays: number;
  status: EnrollmentBaselineStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    conversionRate: number,
    checksum: string,
    country: string,
    quantity: number,
    sendAt: number,
    version: number,
    windowDays: number,
    status: EnrollmentBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.country = country;
    this.quantity = quantity;
    this.sendAt = sendAt;
    this.version = version;
    this.windowDays = windowDays;
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

  canMoveTo(next: EnrollmentBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"enrollment baseline"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.threshold - this.conversionRate) * 100) / 100;
  }

  copy(): EnrollmentBaseline {
    return new EnrollmentBaseline(
      this.code,
      this.title,
      this.threshold,
      this.conversionRate,
      this.checksum,
      this.country,
      this.quantity,
      this.sendAt,
      this.version,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a enrollment baseline in status proposed. */
export function newEnrollmentBaseline(code: string, title: string): EnrollmentBaseline {
  return new EnrollmentBaseline(code, title, 0, 0, "", "", 0, 0, 0, 0, "proposed");
}
