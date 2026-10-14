/**
 * The lenient retention forecast records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient retention forecast is in its life cycle. */
export type LenientRetentionForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One lenient retention forecast, with what the planners need to act on it. */
export class LenientRetentionForecast {
  code: string;
  label: string;
  floorValue: number;
  rate: number;
  checksum: string;
  segment: string;
  status: LenientRetentionForecastStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    rate: number,
    checksum: string,
    segment: string,
    status: LenientRetentionForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.rate = rate;
    this.checksum = checksum;
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

  canMoveTo(next: LenientRetentionForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientRetentionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient retention forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient retention forecast"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.rate - this.floorValue) * 100) / 100;
  }

  copy(): LenientRetentionForecast {
    return new LenientRetentionForecast(
      this.code,
      this.label,
      this.floorValue,
      this.rate,
      this.checksum,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient retention forecast in status open. */
export function newLenientRetentionForecast(code: string, label: string): LenientRetentionForecast {
  return new LenientRetentionForecast(code, label, 0, 0, "", "", "open");
}
