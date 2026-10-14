/**
 * The flight record records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight record is in its life cycle. */
export type FlightRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a flight record and its current status. */
export class FlightRecord {
  code: string;
  label: string;
  locale: string;
  cost: number;
  segment: string;
  status: FlightRecordStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    cost: number,
    segment: string,
    status: FlightRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.cost = cost;
    this.segment = segment;
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

  canMoveTo(next: FlightRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FlightRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): FlightRecord {
    return new FlightRecord(this.code, this.label, this.locale, this.cost, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight record in status open. */
export function newFlightRecord(code: string, label: string): FlightRecord {
  return new FlightRecord(code, label, "", 0, "", "open");
}
