/**
 * The fallback cohort slot records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback cohort slot is in its life cycle. */
export type FallbackCohortSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback cohort slot. Its code is unique within a tenant. */
export class FallbackCohortSlot {
  code: string;
  label: string;
  weight: number;
  budget: number;
  archived: boolean;
  timezone: string;
  ratio: number;
  cohort: string;
  quantity: number;
  unit: string;
  journeyId: string;
  status: FallbackCohortSlotStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    budget: number,
    archived: boolean,
    timezone: string,
    ratio: number,
    cohort: string,
    quantity: number,
    unit: string,
    journeyId: string,
    status: FallbackCohortSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.budget = budget;
    this.archived = archived;
    this.timezone = timezone;
    this.ratio = ratio;
    this.cohort = cohort;
    this.quantity = quantity;
    this.unit = unit;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackCohortSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCohortSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback cohort slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round(this.quantity * this.budget * 100) / 100;
  }

  copy(): FallbackCohortSlot {
    return new FallbackCohortSlot(
      this.code,
      this.label,
      this.weight,
      this.budget,
      this.archived,
      this.timezone,
      this.ratio,
      this.cohort,
      this.quantity,
      this.unit,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback cohort slot in status requested. */
export function newFallbackCohortSlot(code: string, label: string): FallbackCohortSlot {
  return new FallbackCohortSlot(code, label, 0, 0, false, "", 0, "", 0, "", "", "requested");
}
