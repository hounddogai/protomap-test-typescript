/**
 * The double opt in assignment records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in assignment is in its life cycle. */
export type DoubleOptInAssignmentStatus = "created" | "validated" | "published" | "retired";

/** One double opt in assignment, with what the planners need to act on it. */
export class DoubleOptInAssignment {
  code: string;
  name: string;
  discount: number;
  maximum: number;
  segment: string;
  createdAt: number;
  floorValue: number;
  expiresAt: number;
  status: DoubleOptInAssignmentStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    maximum: number,
    segment: string,
    createdAt: number,
    floorValue: number,
    expiresAt: number,
    status: DoubleOptInAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.maximum = maximum;
    this.segment = segment;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: DoubleOptInAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.maximum + this.discount) * 100) / 100;
  }

  copy(): DoubleOptInAssignment {
    return new DoubleOptInAssignment(
      this.code,
      this.name,
      this.discount,
      this.maximum,
      this.segment,
      this.createdAt,
      this.floorValue,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a double opt in assignment in status created. */
export function newDoubleOptInAssignment(code: string, name: string): DoubleOptInAssignment {
  return new DoubleOptInAssignment(code, name, 0, 0, "", 0, 0, 0, "created");
}
