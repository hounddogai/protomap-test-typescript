import * as text from "../../../../kit/text.js";

/** Where a fraud check reservation is in its life cycle. */
export type FraudCheckReservationStatus = "created" | "validated" | "published" | "retired";

/** One fraud check reservation, with what the planners need to act on it. */
export class FraudCheckReservation {
  code: string;
  title: string;
  country: string;
  discount: number;
  durationMinutes: number;
  impressions: number;
  notes: string;
  revision: number;
  sequence: number;
  amount: number;
  summary: string;
  status: FraudCheckReservationStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    discount: number,
    durationMinutes: number,
    impressions: number,
    notes: string,
    revision: number,
    sequence: number,
    amount: number,
    summary: string,
    status: FraudCheckReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.discount = discount;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
    this.notes = notes;
    this.revision = revision;
    this.sequence = sequence;
    this.amount = amount;
    this.summary = summary;
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

  canMoveTo(next: FraudCheckReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: FraudCheckReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.durationMinutes * this.discount * 100) / 100;
  }

  copy(): FraudCheckReservation {
    return new FraudCheckReservation(
      this.code,
      this.title,
      this.country,
      this.discount,
      this.durationMinutes,
      this.impressions,
      this.notes,
      this.revision,
      this.sequence,
      this.amount,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fraud check reservation in status created. */
export function newFraudCheckReservation(code: string, title: string): FraudCheckReservation {
  return new FraudCheckReservation(code, title, "", 0, 0, 0, "", 0, 0, 0, "", "created");
}
