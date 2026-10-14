/**
 * The bounce forecast records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce forecast is in its life cycle. */
export type BounceForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One bounce forecast, with what the planners need to act on it. */
export class BounceForecast {
  code: string;
  label: string;
  notes: string;
  archived: boolean;
  durationMinutes: number;
  status: BounceForecastStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    archived: boolean,
    durationMinutes: number,
    status: BounceForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): BounceForecast {
    return new BounceForecast(this.code, this.label, this.notes, this.archived, this.durationMinutes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bounce forecast in status proposed. */
export function newBounceForecast(code: string, label: string): BounceForecast {
  return new BounceForecast(code, label, "", false, 0, "proposed");
}
