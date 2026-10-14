/**
 * The deflection segment records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection segment is in its life cycle. */
export type DeflectionSegmentStatus = "created" | "validated" | "published" | "retired";

/** One deflection segment, with what the planners need to act on it. */
export class DeflectionSegment {
  code: string;
  name: string;
  discount: number;
  tags: string[];
  expiresAt: number;
  variant: string;
  approved: boolean;
  minimum: number;
  unit: string;
  status: DeflectionSegmentStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    tags: string[],
    expiresAt: number,
    variant: string,
    approved: boolean,
    minimum: number,
    unit: string,
    status: DeflectionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.tags = tags;
    this.expiresAt = expiresAt;
    this.variant = variant;
    this.approved = approved;
    this.minimum = minimum;
    this.unit = unit;
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

  canMoveTo(next: DeflectionSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
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

  moveTo(next: DeflectionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round((this.discount + this.expiresAt) * 100) / 100;
  }

  copy(): DeflectionSegment {
    return new DeflectionSegment(
      this.code,
      this.name,
      this.discount,
      this.tags,
      this.expiresAt,
      this.variant,
      this.approved,
      this.minimum,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a deflection segment in status created. */
export function newDeflectionSegment(code: string, name: string): DeflectionSegment {
  return new DeflectionSegment(code, name, 0, [], 0, "", false, 0, "", "created");
}
