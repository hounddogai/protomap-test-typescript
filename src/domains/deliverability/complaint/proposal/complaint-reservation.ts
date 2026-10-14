import * as text from "../../../../kit/text.js";

/** Where a complaint reservation is in its life cycle. */
export type ComplaintReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A complaint reservation. Its code is unique within a tenant. */
export class ComplaintReservation {
  code: string;
  label: string;
  unit: string;
  cohort: string;
  source: string;
  discount: number;
  margin: number;
  utmSource: string;
  retries: number;
  startsAt: number;
  status: ComplaintReservationStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    cohort: string,
    source: string,
    discount: number,
    margin: number,
    utmSource: string,
    retries: number,
    startsAt: number,
    status: ComplaintReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.cohort = cohort;
    this.source = source;
    this.discount = discount;
    this.margin = margin;
    this.utmSource = utmSource;
    this.retries = retries;
    this.startsAt = startsAt;
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

  canMoveTo(next: ComplaintReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.startsAt + this.retries) * 100) / 100;
  }

  copy(): ComplaintReservation {
    return new ComplaintReservation(
      this.code,
      this.label,
      this.unit,
      this.cohort,
      this.source,
      this.discount,
      this.margin,
      this.utmSource,
      this.retries,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a complaint reservation in status new. */
export function newComplaintReservation(code: string, label: string): ComplaintReservation {
  return new ComplaintReservation(code, label, "", "", "", 0, 0, "", 0, 0, "new");
}
