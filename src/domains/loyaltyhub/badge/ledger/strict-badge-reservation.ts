import * as text from "../../../../kit/text.js";

/** Where a strict badge reservation is in its life cycle. */
export type StrictBadgeReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a strict badge reservation and its current status. */
export class StrictBadgeReservation {
  code: string;
  name: string;
  summary: string;
  weight: number;
  locale: string;
  audienceId: string;
  status: StrictBadgeReservationStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    weight: number,
    locale: string,
    audienceId: string,
    status: StrictBadgeReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.weight = weight;
    this.locale = locale;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictBadgeReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictBadgeReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict badge reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): StrictBadgeReservation {
    return new StrictBadgeReservation(
      this.code,
      this.name,
      this.summary,
      this.weight,
      this.locale,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict badge reservation in status open. */
export function newStrictBadgeReservation(code: string, name: string): StrictBadgeReservation {
  return new StrictBadgeReservation(code, name, "", 0, "", "", "open");
}
