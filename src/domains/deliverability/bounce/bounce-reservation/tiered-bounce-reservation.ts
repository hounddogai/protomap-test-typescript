/**
 * The tiered bounce reservation records of deliverability's bounce work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered bounce reservation is in its life cycle. */
export type TieredBounceReservationStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered bounce reservation and its current status. */
export class TieredBounceReservation {
  code: string;
  label: string;
  revision: number;
  rate: number;
  pinned: boolean;
  capacity: number;
  score: number;
  status: TieredBounceReservationStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    rate: number,
    pinned: boolean,
    capacity: number,
    score: number,
    status: TieredBounceReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.rate = rate;
    this.pinned = pinned;
    this.capacity = capacity;
    this.score = score;
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

  canMoveTo(next: TieredBounceReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredBounceReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"tiered bounce reservation"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.rate * this.capacity * 100) / 100;
  }

  copy(): TieredBounceReservation {
    return new TieredBounceReservation(
      this.code,
      this.label,
      this.revision,
      this.rate,
      this.pinned,
      this.capacity,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered bounce reservation in status created. */
export function newTieredBounceReservation(code: string, label: string): TieredBounceReservation {
  return new TieredBounceReservation(code, label, 0, 0, false, 0, 0, "created");
}
