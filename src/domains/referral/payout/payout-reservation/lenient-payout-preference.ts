import * as text from "../../../../kit/text.js";

/** Where a lenient payout preference is in its life cycle. */
export type LenientPayoutPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient payout preference, with what the planners need to act on it. */
export class LenientPayoutPreference {
  code: string;
  name: string;
  margin: number;
  sequence: number;
  externalRef: string;
  label: string;
  batchSize: number;
  budget: number;
  minimum: number;
  campaignRef: string;
  cohort: string;
  status: LenientPayoutPreferenceStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    sequence: number,
    externalRef: string,
    label: string,
    batchSize: number,
    budget: number,
    minimum: number,
    campaignRef: string,
    cohort: string,
    status: LenientPayoutPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.label = label;
    this.batchSize = batchSize;
    this.budget = budget;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPayoutPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientPayoutPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient payout preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient payout preference"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.sequence - this.minimum) * 100) / 100;
  }

  copy(): LenientPayoutPreference {
    return new LenientPayoutPreference(
      this.code,
      this.name,
      this.margin,
      this.sequence,
      this.externalRef,
      this.label,
      this.batchSize,
      this.budget,
      this.minimum,
      this.campaignRef,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient payout preference in status planned. */
export function newLenientPayoutPreference(code: string, name: string): LenientPayoutPreference {
  return new LenientPayoutPreference(code, name, 0, 0, "", "", 0, 0, 0, "", "", "planned");
}
