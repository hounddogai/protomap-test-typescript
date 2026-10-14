/**
 * The rolling badge assignment records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling badge assignment is in its life cycle. */
export type RollingBadgeAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling badge assignment as the badge team keeps it. */
export class RollingBadgeAssignment {
  code: string;
  label: string;
  bid: number;
  batchSize: number;
  graceDays: number;
  pinned: boolean;
  threshold: number;
  startsAt: number;
  country: string;
  amount: number;
  status: RollingBadgeAssignmentStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    batchSize: number,
    graceDays: number,
    pinned: boolean,
    threshold: number,
    startsAt: number,
    country: string,
    amount: number,
    status: RollingBadgeAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.pinned = pinned;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.country = country;
    this.amount = amount;
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

  canMoveTo(next: RollingBadgeAssignmentStatus): boolean {
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

  moveTo(next: RollingBadgeAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling badge assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.threshold - this.startsAt) * 100) / 100;
  }

  copy(): RollingBadgeAssignment {
    return new RollingBadgeAssignment(
      this.code,
      this.label,
      this.bid,
      this.batchSize,
      this.graceDays,
      this.pinned,
      this.threshold,
      this.startsAt,
      this.country,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling badge assignment in status requested. */
export function newRollingBadgeAssignment(code: string, label: string): RollingBadgeAssignment {
  return new RollingBadgeAssignment(code, label, 0, 0, 0, false, 0, 0, "", 0, "requested");
}
