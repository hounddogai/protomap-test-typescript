import * as text from "../../../../kit/text.js";

/** Where a scheduled conversion reservation is in its life cycle. */
export type ScheduledConversionReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled conversion reservation as the conversion team keeps it. */
export class ScheduledConversionReservation {
  code: string;
  label: string;
  contactEmail: string;
  capacity: number;
  audienceId: string;
  country: string;
  approved: boolean;
  minimum: number;
  budget: number;
  locale: string;
  variant: string;
  status: ScheduledConversionReservationStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    capacity: number,
    audienceId: string,
    country: string,
    approved: boolean,
    minimum: number,
    budget: number,
    locale: string,
    variant: string,
    status: ScheduledConversionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.country = country;
    this.approved = approved;
    this.minimum = minimum;
    this.budget = budget;
    this.locale = locale;
    this.variant = variant;
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

  canMoveTo(next: ScheduledConversionReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledConversionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled conversion reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.budget + this.capacity) * 100) / 100;
  }

  copy(): ScheduledConversionReservation {
    return new ScheduledConversionReservation(
      this.code,
      this.label,
      this.contactEmail,
      this.capacity,
      this.audienceId,
      this.country,
      this.approved,
      this.minimum,
      this.budget,
      this.locale,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled conversion reservation in status requested. */
export function newScheduledConversionReservation(code: string, label: string): ScheduledConversionReservation {
  return new ScheduledConversionReservation(code, label, "", 0, "", "", false, 0, 0, "", "", "requested");
}
