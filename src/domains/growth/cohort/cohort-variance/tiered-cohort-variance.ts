/**
 * The tiered cohort variance records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered cohort variance is in its life cycle. */
export type TieredCohortVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered cohort variance, with what the planners need to act on it. */
export class TieredCohortVariance {
  code: string;
  label: string;
  frequencyCap: number;
  unit: string;
  quantity: number;
  phone: string;
  weight: number;
  variant: string;
  status: TieredCohortVarianceStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    unit: string,
    quantity: number,
    phone: string,
    weight: number,
    variant: string,
    status: TieredCohortVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.unit = unit;
    this.quantity = quantity;
    this.phone = phone;
    this.weight = weight;
    this.variant = variant;
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

  canMoveTo(next: TieredCohortVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredCohortVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered cohort variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.weight * this.quantity * 100) / 100;
  }

  copy(): TieredCohortVariance {
    return new TieredCohortVariance(
      this.code,
      this.label,
      this.frequencyCap,
      this.unit,
      this.quantity,
      this.phone,
      this.weight,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered cohort variance in status new. */
export function newTieredCohortVariance(code: string, label: string): TieredCohortVariance {
  return new TieredCohortVariance(code, label, 0, "", 0, "", 0, "", "new");
}
