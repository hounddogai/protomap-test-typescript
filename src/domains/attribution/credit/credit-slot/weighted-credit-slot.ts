/**
 * The weighted credit slot records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted credit slot is in its life cycle. */
export type WeightedCreditSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted credit slot and its current status. */
export class WeightedCreditSlot {
  code: string;
  name: string;
  cost: number;
  locale: string;
  version: number;
  conversionRate: number;
  frequencyCap: number;
  expiresAt: number;
  createdAt: number;
  budget: number;
  status: WeightedCreditSlotStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    locale: string,
    version: number,
    conversionRate: number,
    frequencyCap: number,
    expiresAt: number,
    createdAt: number,
    budget: number,
    status: WeightedCreditSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.locale = locale;
    this.version = version;
    this.conversionRate = conversionRate;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.budget = budget;
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

  canMoveTo(next: WeightedCreditSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedCreditSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted credit slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"weighted credit slot"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.cost + this.version) * 100) / 100;
  }

  copy(): WeightedCreditSlot {
    return new WeightedCreditSlot(
      this.code,
      this.name,
      this.cost,
      this.locale,
      this.version,
      this.conversionRate,
      this.frequencyCap,
      this.expiresAt,
      this.createdAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted credit slot in status proposed. */
export function newWeightedCreditSlot(code: string, name: string): WeightedCreditSlot {
  return new WeightedCreditSlot(code, name, 0, "", 0, 0, 0, 0, 0, 0, "proposed");
}
