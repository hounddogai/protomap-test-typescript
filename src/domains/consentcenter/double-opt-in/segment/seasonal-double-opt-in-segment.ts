/**
 * The seasonal double opt in segment records of consentcenter's double opt in work, and the rules, stores,
 * and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal double opt in segment is in its life cycle. */
export type SeasonalDoubleOptInSegmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a seasonal double opt in segment and its current status. */
export class SeasonalDoubleOptInSegment {
  code: string;
  label: string;
  endsAt: number;
  retries: number;
  maximum: number;
  bid: number;
  cost: number;
  status: SeasonalDoubleOptInSegmentStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    retries: number,
    maximum: number,
    bid: number,
    cost: number,
    status: SeasonalDoubleOptInSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.retries = retries;
    this.maximum = maximum;
    this.bid = bid;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalDoubleOptInSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDoubleOptInSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal double opt in segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round((this.retries - this.cost) * 100) / 100;
  }

  copy(): SeasonalDoubleOptInSegment {
    return new SeasonalDoubleOptInSegment(
      this.code,
      this.label,
      this.endsAt,
      this.retries,
      this.maximum,
      this.bid,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal double opt in segment in status created. */
export function newSeasonalDoubleOptInSegment(code: string, label: string): SeasonalDoubleOptInSegment {
  return new SeasonalDoubleOptInSegment(code, label, 0, 0, 0, 0, 0, "created");
}
