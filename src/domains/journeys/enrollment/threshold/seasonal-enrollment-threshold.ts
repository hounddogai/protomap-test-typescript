/**
 * The seasonal enrollment threshold records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal enrollment threshold is in its life cycle. */
export type SeasonalEnrollmentThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal enrollment threshold and its current status. */
export class SeasonalEnrollmentThreshold {
  code: string;
  label: string;
  budget: number;
  campaignRef: string;
  region: string;
  status: SeasonalEnrollmentThresholdStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    campaignRef: string,
    region: string,
    status: SeasonalEnrollmentThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.campaignRef = campaignRef;
    this.region = region;
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

  canMoveTo(next: SeasonalEnrollmentThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalEnrollmentThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal enrollment threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): SeasonalEnrollmentThreshold {
    return new SeasonalEnrollmentThreshold(
      this.code,
      this.label,
      this.budget,
      this.campaignRef,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal enrollment threshold in status planned. */
export function newSeasonalEnrollmentThreshold(code: string, label: string): SeasonalEnrollmentThreshold {
  return new SeasonalEnrollmentThreshold(code, label, 0, "", "", "planned");
}
