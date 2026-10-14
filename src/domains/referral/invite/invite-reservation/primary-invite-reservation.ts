/**
 * The primary invite reservation records of referral's invite work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary invite reservation is in its life cycle. */
export type PrimaryInviteReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A primary invite reservation. Its code is unique within a tenant. */
export class PrimaryInviteReservation {
  code: string;
  name: string;
  rate: number;
  floorValue: number;
  score: number;
  checksum: string;
  status: PrimaryInviteReservationStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    floorValue: number,
    score: number,
    checksum: string,
    status: PrimaryInviteReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.floorValue = floorValue;
    this.score = score;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryInviteReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryInviteReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary invite reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary invite reservation"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.rate) * 100) / 100;
  }

  copy(): PrimaryInviteReservation {
    return new PrimaryInviteReservation(
      this.code,
      this.name,
      this.rate,
      this.floorValue,
      this.score,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary invite reservation in status open. */
export function newPrimaryInviteReservation(code: string, name: string): PrimaryInviteReservation {
  return new PrimaryInviteReservation(code, name, 0, 0, 0, "", "open");
}
