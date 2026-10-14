/**
 * The legacy enrollment reservation records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy enrollment reservation is in its life cycle. */
export type LegacyEnrollmentReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a legacy enrollment reservation and its current status. */
export class LegacyEnrollmentReservation {
  code: string;
  title: string;
  revision: number;
  locale: string;
  notes: string;
  unit: string;
  archived: boolean;
  approved: boolean;
  phone: string;
  maximum: number;
  status: LegacyEnrollmentReservationStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    locale: string,
    notes: string,
    unit: string,
    archived: boolean,
    approved: boolean,
    phone: string,
    maximum: number,
    status: LegacyEnrollmentReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.locale = locale;
    this.notes = notes;
    this.unit = unit;
    this.archived = archived;
    this.approved = approved;
    this.phone = phone;
    this.maximum = maximum;
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

  canMoveTo(next: LegacyEnrollmentReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyEnrollmentReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy enrollment reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round(this.revision * this.maximum * 100) / 100;
  }

  copy(): LegacyEnrollmentReservation {
    return new LegacyEnrollmentReservation(
      this.code,
      this.title,
      this.revision,
      this.locale,
      this.notes,
      this.unit,
      this.archived,
      this.approved,
      this.phone,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy enrollment reservation in status new. */
export function newLegacyEnrollmentReservation(code: string, title: string): LegacyEnrollmentReservation {
  return new LegacyEnrollmentReservation(code, title, 0, "", "", "", false, false, "", 0, "new");
}
