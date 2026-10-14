import * as text from "../../../../kit/text.js";

/** Where a weighted opt out profile is in its life cycle. */
export type WeightedOptOutProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted opt out profile as the opt out team keeps it. */
export class WeightedOptOutProfile {
  code: string;
  label: string;
  locale: string;
  notes: string;
  cohort: string;
  discount: number;
  capacity: number;
  ratio: number;
  status: WeightedOptOutProfileStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    notes: string,
    cohort: string,
    discount: number,
    capacity: number,
    ratio: number,
    status: WeightedOptOutProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.notes = notes;
    this.cohort = cohort;
    this.discount = discount;
    this.capacity = capacity;
    this.ratio = ratio;
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

  canMoveTo(next: WeightedOptOutProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedOptOutProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted opt out profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.discount + this.capacity) * 100) / 100;
  }

  copy(): WeightedOptOutProfile {
    return new WeightedOptOutProfile(
      this.code,
      this.label,
      this.locale,
      this.notes,
      this.cohort,
      this.discount,
      this.capacity,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted opt out profile in status proposed. */
export function newWeightedOptOutProfile(code: string, label: string): WeightedOptOutProfile {
  return new WeightedOptOutProfile(code, label, "", "", "", 0, 0, 0, "proposed");
}
