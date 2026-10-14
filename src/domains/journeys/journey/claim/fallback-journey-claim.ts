import * as text from "../../../../kit/text.js";

/** Where a fallback journey claim is in its life cycle. */
export type FallbackJourneyClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fallback journey claim, with what the planners need to act on it. */
export class FallbackJourneyClaim {
  code: string;
  label: string;
  country: string;
  threshold: number;
  locale: string;
  status: FallbackJourneyClaimStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    threshold: number,
    locale: string,
    status: FallbackJourneyClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.threshold = threshold;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackJourneyClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackJourneyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback journey claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): FallbackJourneyClaim {
    return new FallbackJourneyClaim(this.code, this.label, this.country, this.threshold, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback journey claim in status new. */
export function newFallbackJourneyClaim(code: string, label: string): FallbackJourneyClaim {
  return new FallbackJourneyClaim(code, label, "", 0, "", "new");
}
