import * as text from "../../../../kit/text.js";

/** Where a manual deflection reservation is in its life cycle. */
export type ManualDeflectionReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual deflection reservation. Its code is unique within a tenant. */
export class ManualDeflectionReservation {
  code: string;
  title: string;
  minimum: number;
  impressions: number;
  checksum: string;
  variant: string;
  attempts: number;
  externalRef: string;
  status: ManualDeflectionReservationStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    impressions: number,
    checksum: string,
    variant: string,
    attempts: number,
    externalRef: string,
    status: ManualDeflectionReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.impressions = impressions;
    this.checksum = checksum;
    this.variant = variant;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualDeflectionReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualDeflectionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual deflection reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round((this.attempts - this.impressions) * 100) / 100;
  }

  copy(): ManualDeflectionReservation {
    return new ManualDeflectionReservation(
      this.code,
      this.title,
      this.minimum,
      this.impressions,
      this.checksum,
      this.variant,
      this.attempts,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual deflection reservation in status proposed. */
export function newManualDeflectionReservation(code: string, title: string): ManualDeflectionReservation {
  return new ManualDeflectionReservation(code, title, 0, 0, "", "", 0, "", "proposed");
}
