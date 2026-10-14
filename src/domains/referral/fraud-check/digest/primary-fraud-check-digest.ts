/**
 * The primary fraud check digest records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary fraud check digest is in its life cycle. */
export type PrimaryFraudCheckDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary fraud check digest and its current status. */
export class PrimaryFraudCheckDigest {
  code: string;
  name: string;
  graceDays: number;
  durationMinutes: number;
  startsAt: number;
  revision: number;
  status: PrimaryFraudCheckDigestStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    durationMinutes: number,
    startsAt: number,
    revision: number,
    status: PrimaryFraudCheckDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.durationMinutes = durationMinutes;
    this.startsAt = startsAt;
    this.revision = revision;
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

  canMoveTo(next: PrimaryFraudCheckDigestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryFraudCheckDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary fraud check digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"primary fraud check digest"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.revision * this.startsAt * 100) / 100;
  }

  copy(): PrimaryFraudCheckDigest {
    return new PrimaryFraudCheckDigest(
      this.code,
      this.name,
      this.graceDays,
      this.durationMinutes,
      this.startsAt,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary fraud check digest in status new. */
export function newPrimaryFraudCheckDigest(code: string, name: string): PrimaryFraudCheckDigest {
  return new PrimaryFraudCheckDigest(code, name, 0, 0, 0, 0, "new");
}
