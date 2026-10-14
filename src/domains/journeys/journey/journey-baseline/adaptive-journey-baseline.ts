/**
 * The adaptive journey baseline records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive journey baseline is in its life cycle. */
export type AdaptiveJourneyBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** One adaptive journey baseline, with what the planners need to act on it. */
export class AdaptiveJourneyBaseline {
  code: string;
  label: string;
  durationMinutes: number;
  externalRef: string;
  minimum: number;
  channel: string;
  status: AdaptiveJourneyBaselineStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    externalRef: string,
    minimum: number,
    channel: string,
    status: AdaptiveJourneyBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveJourneyBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveJourneyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive journey baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive journey baseline"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.minimum * this.durationMinutes * 100) / 100;
  }

  copy(): AdaptiveJourneyBaseline {
    return new AdaptiveJourneyBaseline(
      this.code,
      this.label,
      this.durationMinutes,
      this.externalRef,
      this.minimum,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive journey baseline in status requested. */
export function newAdaptiveJourneyBaseline(code: string, label: string): AdaptiveJourneyBaseline {
  return new AdaptiveJourneyBaseline(code, label, 0, "", 0, "", "requested");
}
