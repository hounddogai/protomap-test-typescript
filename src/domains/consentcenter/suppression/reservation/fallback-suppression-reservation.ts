import * as text from "../../../../kit/text.js";

/** Where a fallback suppression reservation is in its life cycle. */
export type FallbackSuppressionReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback suppression reservation and its current status. */
export class FallbackSuppressionReservation {
  code: string;
  label: string;
  capacity: number;
  version: number;
  conversionRate: number;
  createdAt: number;
  ownerId: string;
  unit: string;
  tags: string[];
  weight: number;
  discount: number;
  status: FallbackSuppressionReservationStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    version: number,
    conversionRate: number,
    createdAt: number,
    ownerId: string,
    unit: string,
    tags: string[],
    weight: number,
    discount: number,
    status: FallbackSuppressionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.version = version;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.unit = unit;
    this.tags = tags;
    this.weight = weight;
    this.discount = discount;
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

  canMoveTo(next: FallbackSuppressionReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackSuppressionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback suppression reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.weight * this.conversionRate * 100) / 100;
  }

  copy(): FallbackSuppressionReservation {
    return new FallbackSuppressionReservation(
      this.code,
      this.label,
      this.capacity,
      this.version,
      this.conversionRate,
      this.createdAt,
      this.ownerId,
      this.unit,
      this.tags,
      this.weight,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback suppression reservation in status new. */
export function newFallbackSuppressionReservation(code: string, label: string): FallbackSuppressionReservation {
  return new FallbackSuppressionReservation(code, label, 0, 0, 0, 0, "", "", [], 0, 0, "new");
}
