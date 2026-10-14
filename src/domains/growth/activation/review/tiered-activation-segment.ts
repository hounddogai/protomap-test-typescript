import * as text from "../../../../kit/text.js";

/** Where a tiered activation segment is in its life cycle. */
export type TieredActivationSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tiered activation segment and its current status. */
export class TieredActivationSegment {
  code: string;
  label: string;
  discount: number;
  capacity: number;
  floorValue: number;
  expiresAt: number;
  sequence: number;
  status: TieredActivationSegmentStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    capacity: number,
    floorValue: number,
    expiresAt: number,
    sequence: number,
    status: TieredActivationSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredActivationSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredActivationSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered activation segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round((this.floorValue - this.sequence) * 100) / 100;
  }

  copy(): TieredActivationSegment {
    return new TieredActivationSegment(
      this.code,
      this.label,
      this.discount,
      this.capacity,
      this.floorValue,
      this.expiresAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered activation segment in status new. */
export function newTieredActivationSegment(code: string, label: string): TieredActivationSegment {
  return new TieredActivationSegment(code, label, 0, 0, 0, 0, 0, "new");
}
