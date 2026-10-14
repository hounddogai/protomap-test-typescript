import * as text from "../../../../kit/text.js";

/** Where a bounce segment is in its life cycle. */
export type BounceSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a bounce segment and its current status. */
export class BounceSegment {
  code: string;
  name: string;
  quantity: number;
  maximum: number;
  expiresAt: number;
  capacity: number;
  status: BounceSegmentStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    maximum: number,
    expiresAt: number,
    capacity: number,
    status: BounceSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BounceSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.capacity - this.expiresAt) * 100) / 100;
  }

  copy(): BounceSegment {
    return new BounceSegment(
      this.code,
      this.name,
      this.quantity,
      this.maximum,
      this.expiresAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bounce segment in status planned. */
export function newBounceSegment(code: string, name: string): BounceSegment {
  return new BounceSegment(code, name, 0, 0, 0, 0, "planned");
}
