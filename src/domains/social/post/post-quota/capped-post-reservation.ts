import * as text from "../../../../kit/text.js";

/** Where a capped post reservation is in its life cycle. */
export type CappedPostReservationStatus = "created" | "validated" | "published" | "retired";

/** The record of a capped post reservation and its current status. */
export class CappedPostReservation {
  code: string;
  label: string;
  capacity: number;
  unit: string;
  windowDays: number;
  createdAt: number;
  country: string;
  impressions: number;
  source: string;
  status: CappedPostReservationStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    unit: string,
    windowDays: number,
    createdAt: number,
    country: string,
    impressions: number,
    source: string,
    status: CappedPostReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.unit = unit;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.country = country;
    this.impressions = impressions;
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

  canMoveTo(next: CappedPostReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
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

  moveTo(next: CappedPostReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped post reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.createdAt * this.capacity * 100) / 100;
  }

  copy(): CappedPostReservation {
    return new CappedPostReservation(
      this.code,
      this.label,
      this.capacity,
      this.unit,
      this.windowDays,
      this.createdAt,
      this.country,
      this.impressions,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped post reservation in status created. */
export function newCappedPostReservation(code: string, label: string): CappedPostReservation {
  return new CappedPostReservation(code, label, 0, "", 0, 0, "", 0, "", "created");
}
