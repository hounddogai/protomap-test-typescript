/**
 * The double opt in reservation records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in reservation is in its life cycle. */
export type DoubleOptInReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One double opt in reservation, with what the planners need to act on it. */
export class DoubleOptInReservation {
  code: string;
  name: string;
  weight: number;
  tags: string[];
  revision: number;
  checksum: string;
  rate: number;
  threshold: number;
  status: DoubleOptInReservationStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    tags: string[],
    revision: number,
    checksum: string,
    rate: number,
    threshold: number,
    status: DoubleOptInReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.tags = tags;
    this.revision = revision;
    this.checksum = checksum;
    this.rate = rate;
    this.threshold = threshold;
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

  canMoveTo(next: DoubleOptInReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DoubleOptInReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"double opt in reservation"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.weight - this.revision) * 100) / 100;
  }

  copy(): DoubleOptInReservation {
    return new DoubleOptInReservation(
      this.code,
      this.name,
      this.weight,
      this.tags,
      this.revision,
      this.checksum,
      this.rate,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a double opt in reservation in status open. */
export function newDoubleOptInReservation(code: string, name: string): DoubleOptInReservation {
  return new DoubleOptInReservation(code, name, 0, [], 0, "", 0, 0, "open");
}
