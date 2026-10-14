import * as text from "../../../../kit/text.js";

/** Where a nudge reservation is in its life cycle. */
export type NudgeReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A nudge reservation. Its code is unique within a tenant. */
export class NudgeReservation {
  code: string;
  title: string;
  approved: boolean;
  locale: string;
  conversionRate: number;
  status: NudgeReservationStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    locale: string,
    conversionRate: number,
    status: NudgeReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): NudgeReservation {
    return new NudgeReservation(this.code, this.title, this.approved, this.locale, this.conversionRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge reservation in status planned. */
export function newNudgeReservation(code: string, title: string): NudgeReservation {
  return new NudgeReservation(code, title, false, "", 0, "planned");
}
