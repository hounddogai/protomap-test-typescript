/**
 * The activation reservation records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation reservation is in its life cycle. */
export type ActivationReservationStatus = "created" | "validated" | "published" | "retired";

/** One activation reservation, with what the planners need to act on it. */
export class ActivationReservation {
  code: string;
  label: string;
  title: string;
  attempts: number;
  bid: number;
  checksum: string;
  status: ActivationReservationStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    attempts: number,
    bid: number,
    checksum: string,
    status: ActivationReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.attempts = attempts;
    this.bid = bid;
    this.checksum = checksum;
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

  canMoveTo(next: ActivationReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: ActivationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.attempts + this.bid) * 100) / 100;
  }

  copy(): ActivationReservation {
    return new ActivationReservation(
      this.code,
      this.label,
      this.title,
      this.attempts,
      this.bid,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation reservation in status created. */
export function newActivationReservation(code: string, label: string): ActivationReservation {
  return new ActivationReservation(code, label, "", 0, 0, "", "created");
}
