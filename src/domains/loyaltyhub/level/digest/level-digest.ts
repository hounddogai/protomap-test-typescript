/**
 * The level digest records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level digest is in its life cycle. */
export type LevelDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One level digest, with what the planners need to act on it. */
export class LevelDigest {
  code: string;
  label: string;
  capacity: number;
  notes: string;
  limit: number;
  discount: number;
  status: LevelDigestStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    notes: string,
    limit: number,
    discount: number,
    status: LevelDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.notes = notes;
    this.limit = limit;
    this.discount = discount;
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

  canMoveTo(next: LevelDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LevelDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"level digest"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.discount - this.limit) * 100) / 100;
  }

  copy(): LevelDigest {
    return new LevelDigest(this.code, this.label, this.capacity, this.notes, this.limit, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level digest in status proposed. */
export function newLevelDigest(code: string, label: string): LevelDigest {
  return new LevelDigest(code, label, 0, "", 0, 0, "proposed");
}
