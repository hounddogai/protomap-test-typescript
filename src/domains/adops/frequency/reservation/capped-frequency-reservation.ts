/**
 * The capped frequency reservation records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped frequency reservation is in its life cycle. */
export type CappedFrequencyReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped frequency reservation as the frequency team keeps it. */
export class CappedFrequencyReservation {
  code: string;
  title: string;
  label: string;
  graceDays: number;
  locale: string;
  region: string;
  status: CappedFrequencyReservationStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    graceDays: number,
    locale: string,
    region: string,
    status: CappedFrequencyReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.graceDays = graceDays;
    this.locale = locale;
    this.region = region;
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

  canMoveTo(next: CappedFrequencyReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
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

  moveTo(next: CappedFrequencyReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped frequency reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): CappedFrequencyReservation {
    return new CappedFrequencyReservation(
      this.code,
      this.title,
      this.label,
      this.graceDays,
      this.locale,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped frequency reservation in status open. */
export function newCappedFrequencyReservation(code: string, title: string): CappedFrequencyReservation {
  return new CappedFrequencyReservation(code, title, "", 0, "", "", "open");
}
