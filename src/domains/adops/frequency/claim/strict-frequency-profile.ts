import * as text from "../../../../kit/text.js";

/** Where a strict frequency profile is in its life cycle. */
export type StrictFrequencyProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict frequency profile, with what the planners need to act on it. */
export class StrictFrequencyProfile {
  code: string;
  title: string;
  reviewer: string;
  conversionRate: number;
  discount: number;
  minimum: number;
  clicks: number;
  graceDays: number;
  maximum: number;
  sequence: number;
  status: StrictFrequencyProfileStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    conversionRate: number,
    discount: number,
    minimum: number,
    clicks: number,
    graceDays: number,
    maximum: number,
    sequence: number,
    status: StrictFrequencyProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.minimum = minimum;
    this.clicks = clicks;
    this.graceDays = graceDays;
    this.maximum = maximum;
    this.sequence = sequence;
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

  canMoveTo(next: StrictFrequencyProfileStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: StrictFrequencyProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict frequency profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict frequency profile"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.conversionRate * this.clicks * 100) / 100;
  }

  copy(): StrictFrequencyProfile {
    return new StrictFrequencyProfile(
      this.code,
      this.title,
      this.reviewer,
      this.conversionRate,
      this.discount,
      this.minimum,
      this.clicks,
      this.graceDays,
      this.maximum,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict frequency profile in status open. */
export function newStrictFrequencyProfile(code: string, title: string): StrictFrequencyProfile {
  return new StrictFrequencyProfile(code, title, "", 0, 0, 0, 0, 0, 0, 0, "open");
}
