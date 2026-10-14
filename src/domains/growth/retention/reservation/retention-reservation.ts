/**
 * The retention reservation records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention reservation is in its life cycle. */
export type RetentionReservationStatus = "created" | "validated" | "published" | "retired";

/** A retention reservation. Its code is unique within a tenant. */
export class RetentionReservation {
  code: string;
  name: string;
  score: number;
  approved: boolean;
  label: string;
  status: RetentionReservationStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    approved: boolean,
    label: string,
    status: RetentionReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.approved = approved;
    this.label = label;
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

  canMoveTo(next: RetentionReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RetentionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): RetentionReservation {
    return new RetentionReservation(this.code, this.name, this.score, this.approved, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention reservation in status created. */
export function newRetentionReservation(code: string, name: string): RetentionReservation {
  return new RetentionReservation(code, name, 0, false, "", "created");
}
