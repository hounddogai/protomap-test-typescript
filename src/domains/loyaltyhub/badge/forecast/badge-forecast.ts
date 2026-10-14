/**
 * The badge forecast records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge forecast is in its life cycle. */
export type BadgeForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A badge forecast. Its code is unique within a tenant. */
export class BadgeForecast {
  code: string;
  label: string;
  audienceId: string;
  unit: string;
  rate: number;
  status: BadgeForecastStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    unit: string,
    rate: number,
    status: BadgeForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.unit = unit;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BadgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): BadgeForecast {
    return new BadgeForecast(this.code, this.label, this.audienceId, this.unit, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a badge forecast in status draft. */
export function newBadgeForecast(code: string, label: string): BadgeForecast {
  return new BadgeForecast(code, label, "", "", 0, "draft");
}
