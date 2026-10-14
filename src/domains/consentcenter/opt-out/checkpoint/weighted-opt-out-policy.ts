import * as text from "../../../../kit/text.js";

/** Where a weighted opt out policy is in its life cycle. */
export type WeightedOptOutPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a weighted opt out policy and its current status. */
export class WeightedOptOutPolicy {
  code: string;
  label: string;
  unit: string;
  impressions: number;
  country: string;
  cohort: string;
  startsAt: number;
  revision: number;
  frequencyCap: number;
  floorValue: number;
  notes: string;
  status: WeightedOptOutPolicyStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    impressions: number,
    country: string,
    cohort: string,
    startsAt: number,
    revision: number,
    frequencyCap: number,
    floorValue: number,
    notes: string,
    status: WeightedOptOutPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.impressions = impressions;
    this.country = country;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.notes = notes;
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

  canMoveTo(next: WeightedOptOutPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedOptOutPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted opt out policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round((this.impressions + this.frequencyCap) * 100) / 100;
  }

  copy(): WeightedOptOutPolicy {
    return new WeightedOptOutPolicy(
      this.code,
      this.label,
      this.unit,
      this.impressions,
      this.country,
      this.cohort,
      this.startsAt,
      this.revision,
      this.frequencyCap,
      this.floorValue,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted opt out policy in status draft. */
export function newWeightedOptOutPolicy(code: string, label: string): WeightedOptOutPolicy {
  return new WeightedOptOutPolicy(code, label, "", 0, "", "", 0, 0, 0, 0, "", "draft");
}
