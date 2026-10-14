/**
 * The enrollment reservation records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment reservation is in its life cycle. */
export type EnrollmentReservationStatus = "created" | "validated" | "published" | "retired";

/** One enrollment reservation, with what the planners need to act on it. */
export class EnrollmentReservation {
  code: string;
  title: string;
  tags: string[];
  threshold: number;
  currency: string;
  budget: number;
  status: EnrollmentReservationStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    threshold: number,
    currency: string,
    budget: number,
    status: EnrollmentReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.threshold = threshold;
    this.currency = currency;
    this.budget = budget;
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

  canMoveTo(next: EnrollmentReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: EnrollmentReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.budget + this.threshold) * 100) / 100;
  }

  copy(): EnrollmentReservation {
    return new EnrollmentReservation(
      this.code,
      this.title,
      this.tags,
      this.threshold,
      this.currency,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a enrollment reservation in status created. */
export function newEnrollmentReservation(code: string, title: string): EnrollmentReservation {
  return new EnrollmentReservation(code, title, [], 0, "", 0, "created");
}
