import * as text from "../../../../kit/text.js";

/** Where a badge reservation is in its life cycle. */
export type BadgeReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a badge reservation and its current status. */
export class BadgeReservation {
  code: string;
  label: string;
  summary: string;
  floorValue: number;
  conversionRate: number;
  margin: number;
  maximum: number;
  status: BadgeReservationStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    floorValue: number,
    conversionRate: number,
    margin: number,
    maximum: number,
    status: BadgeReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.margin = margin;
    this.maximum = maximum;
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

  canMoveTo(next: BadgeReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"badge reservation"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin - this.conversionRate) * 100) / 100;
  }

  copy(): BadgeReservation {
    return new BadgeReservation(
      this.code,
      this.label,
      this.summary,
      this.floorValue,
      this.conversionRate,
      this.margin,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a badge reservation in status open. */
export function newBadgeReservation(code: string, label: string): BadgeReservation {
  return new BadgeReservation(code, label, "", 0, 0, 0, 0, "open");
}
