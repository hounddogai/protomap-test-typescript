import * as text from "../../../../kit/text.js";

/** Where a bounce reservation is in its life cycle. */
export type BounceReservationStatus = "created" | "validated" | "published" | "retired";

/** One bounce reservation, with what the planners need to act on it. */
export class BounceReservation {
  code: string;
  title: string;
  score: number;
  currency: string;
  unit: string;
  summary: string;
  campaignRef: string;
  budget: number;
  graceDays: number;
  status: BounceReservationStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    currency: string,
    unit: string,
    summary: string,
    campaignRef: string,
    budget: number,
    graceDays: number,
    status: BounceReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.currency = currency;
    this.unit = unit;
    this.summary = summary;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.graceDays = graceDays;
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

  canMoveTo(next: BounceReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BounceReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget + this.score) * 100) / 100;
  }

  copy(): BounceReservation {
    return new BounceReservation(
      this.code,
      this.title,
      this.score,
      this.currency,
      this.unit,
      this.summary,
      this.campaignRef,
      this.budget,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a bounce reservation in status created. */
export function newBounceReservation(code: string, title: string): BounceReservation {
  return new BounceReservation(code, title, 0, "", "", "", "", 0, 0, "created");
}
