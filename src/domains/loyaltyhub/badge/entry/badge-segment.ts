import * as text from "../../../../kit/text.js";

/** Where a badge segment is in its life cycle. */
export type BadgeSegmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a badge segment and its current status. */
export class BadgeSegment {
  code: string;
  name: string;
  region: string;
  capacity: number;
  discount: number;
  source: string;
  status: BadgeSegmentStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    capacity: number,
    discount: number,
    source: string,
    status: BadgeSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.capacity = capacity;
    this.discount = discount;
    this.source = source;
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

  canMoveTo(next: BadgeSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BadgeSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.capacity + this.discount) * 100) / 100;
  }

  copy(): BadgeSegment {
    return new BadgeSegment(this.code, this.name, this.region, this.capacity, this.discount, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a badge segment in status created. */
export function newBadgeSegment(code: string, name: string): BadgeSegment {
  return new BadgeSegment(code, name, "", 0, 0, "", "created");
}
