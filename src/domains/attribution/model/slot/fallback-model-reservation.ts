import * as text from "../../../../kit/text.js";

/** Where a fallback model reservation is in its life cycle. */
export type FallbackModelReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback model reservation. Its code is unique within a tenant. */
export class FallbackModelReservation {
  code: string;
  label: string;
  sequence: number;
  tags: string[];
  graceDays: number;
  margin: number;
  status: FallbackModelReservationStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    tags: string[],
    graceDays: number,
    margin: number,
    status: FallbackModelReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.tags = tags;
    this.graceDays = graceDays;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackModelReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackModelReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback model reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.graceDays + this.margin) * 100) / 100;
  }

  copy(): FallbackModelReservation {
    return new FallbackModelReservation(
      this.code,
      this.label,
      this.sequence,
      this.tags,
      this.graceDays,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback model reservation in status requested. */
export function newFallbackModelReservation(code: string, label: string): FallbackModelReservation {
  return new FallbackModelReservation(code, label, 0, [], 0, 0, "requested");
}
