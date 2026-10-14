/**
 * The manual challenge tier records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual challenge tier is in its life cycle. */
export type ManualChallengeTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual challenge tier, with what the planners need to act on it. */
export class ManualChallengeTier {
  code: string;
  label: string;
  floorValue: number;
  minimum: number;
  country: string;
  status: ManualChallengeTierStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    minimum: number,
    country: string,
    status: ManualChallengeTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.minimum = minimum;
    this.country = country;
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

  canMoveTo(next: ManualChallengeTierStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
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

  moveTo(next: ManualChallengeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual challenge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual challenge tier"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.floorValue - this.minimum) * 100) / 100;
  }

  copy(): ManualChallengeTier {
    return new ManualChallengeTier(this.code, this.label, this.floorValue, this.minimum, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual challenge tier in status open. */
export function newManualChallengeTier(code: string, label: string): ManualChallengeTier {
  return new ManualChallengeTier(code, label, 0, 0, "", "open");
}
