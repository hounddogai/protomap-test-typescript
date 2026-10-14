/**
 * The weighted pacing slot records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted pacing slot is in its life cycle. */
export type WeightedPacingSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted pacing slot, with what the planners need to act on it. */
export class WeightedPacingSlot {
  code: string;
  label: string;
  limit: number;
  country: string;
  retries: number;
  checksum: string;
  unit: string;
  cohort: string;
  graceDays: number;
  status: WeightedPacingSlotStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    country: string,
    retries: number,
    checksum: string,
    unit: string,
    cohort: string,
    graceDays: number,
    status: WeightedPacingSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.country = country;
    this.retries = retries;
    this.checksum = checksum;
    this.unit = unit;
    this.cohort = cohort;
    this.graceDays = graceDays;
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

  canMoveTo(next: WeightedPacingSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedPacingSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted pacing slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round((this.graceDays + this.limit) * 100) / 100;
  }

  copy(): WeightedPacingSlot {
    return new WeightedPacingSlot(
      this.code,
      this.label,
      this.limit,
      this.country,
      this.retries,
      this.checksum,
      this.unit,
      this.cohort,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted pacing slot in status proposed. */
export function newWeightedPacingSlot(code: string, label: string): WeightedPacingSlot {
  return new WeightedPacingSlot(code, label, 0, "", 0, "", "", "", 0, "proposed");
}
