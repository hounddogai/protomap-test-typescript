/**
 * The strict enrollment digest records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict enrollment digest is in its life cycle. */
export type StrictEnrollmentDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict enrollment digest. Its code is unique within a tenant. */
export class StrictEnrollmentDigest {
  code: string;
  title: string;
  cost: number;
  unit: string;
  utmSource: string;
  createdAt: number;
  margin: number;
  sequence: number;
  status: StrictEnrollmentDigestStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    unit: string,
    utmSource: string,
    createdAt: number,
    margin: number,
    sequence: number,
    status: StrictEnrollmentDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.unit = unit;
    this.utmSource = utmSource;
    this.createdAt = createdAt;
    this.margin = margin;
    this.sequence = sequence;
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

  canMoveTo(next: StrictEnrollmentDigestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictEnrollmentDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict enrollment digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.cost * this.margin * 100) / 100;
  }

  copy(): StrictEnrollmentDigest {
    return new StrictEnrollmentDigest(
      this.code,
      this.title,
      this.cost,
      this.unit,
      this.utmSource,
      this.createdAt,
      this.margin,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict enrollment digest in status new. */
export function newStrictEnrollmentDigest(code: string, title: string): StrictEnrollmentDigest {
  return new StrictEnrollmentDigest(code, title, 0, "", "", 0, 0, 0, "new");
}
