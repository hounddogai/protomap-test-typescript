/**
 * The fallback challenge override records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback challenge override is in its life cycle. */
export type FallbackChallengeOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback challenge override as the challenge team keeps it. */
export class FallbackChallengeOverride {
  code: string;
  name: string;
  country: string;
  budget: number;
  cohort: string;
  status: FallbackChallengeOverrideStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    budget: number,
    cohort: string,
    status: FallbackChallengeOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.budget = budget;
    this.cohort = cohort;
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

  canMoveTo(next: FallbackChallengeOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: FallbackChallengeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback challenge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback challenge override"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): FallbackChallengeOverride {
    return new FallbackChallengeOverride(this.code, this.name, this.country, this.budget, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback challenge override in status open. */
export function newFallbackChallengeOverride(code: string, name: string): FallbackChallengeOverride {
  return new FallbackChallengeOverride(code, name, "", 0, "", "open");
}
