import * as text from "../../../../kit/text.js";

/** Where a fallback preference rollup is in its life cycle. */
export type FallbackPreferenceRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback preference rollup and its current status. */
export class FallbackPreferenceRollup {
  code: string;
  label: string;
  variant: string;
  attempts: number;
  budget: number;
  sequence: number;
  amount: number;
  floorValue: number;
  country: string;
  bid: number;
  minimum: number;
  status: FallbackPreferenceRollupStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    attempts: number,
    budget: number,
    sequence: number,
    amount: number,
    floorValue: number,
    country: string,
    bid: number,
    minimum: number,
    status: FallbackPreferenceRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.attempts = attempts;
    this.budget = budget;
    this.sequence = sequence;
    this.amount = amount;
    this.floorValue = floorValue;
    this.country = country;
    this.bid = bid;
    this.minimum = minimum;
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

  canMoveTo(next: FallbackPreferenceRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackPreferenceRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback preference rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.sequence * this.attempts * 100) / 100;
  }

  copy(): FallbackPreferenceRollup {
    return new FallbackPreferenceRollup(
      this.code,
      this.label,
      this.variant,
      this.attempts,
      this.budget,
      this.sequence,
      this.amount,
      this.floorValue,
      this.country,
      this.bid,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback preference rollup in status proposed. */
export function newFallbackPreferenceRollup(code: string, label: string): FallbackPreferenceRollup {
  return new FallbackPreferenceRollup(code, label, "", 0, 0, 0, 0, 0, "", 0, 0, "proposed");
}
