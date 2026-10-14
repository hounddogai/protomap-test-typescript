/**
 * The enrollment digest records of journeys's enrollment work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment digest is in its life cycle. */
export type EnrollmentDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One enrollment digest, with what the planners need to act on it. */
export class EnrollmentDigest {
  code: string;
  label: string;
  region: string;
  name: string;
  margin: number;
  limit: number;
  status: EnrollmentDigestStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    name: string,
    margin: number,
    limit: number,
    status: EnrollmentDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.name = name;
    this.margin = margin;
    this.limit = limit;
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

  canMoveTo(next: EnrollmentDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"enrollment digest"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.limit + this.margin) * 100) / 100;
  }

  copy(): EnrollmentDigest {
    return new EnrollmentDigest(this.code, this.label, this.region, this.name, this.margin, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a enrollment digest in status proposed. */
export function newEnrollmentDigest(code: string, label: string): EnrollmentDigest {
  return new EnrollmentDigest(code, label, "", "", 0, 0, "proposed");
}
