import * as text from "../../../../kit/text.js";

/** Where a weighted conversion budget is in its life cycle. */
export type WeightedConversionBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a weighted conversion budget and its current status. */
export class WeightedConversionBudget {
  code: string;
  label: string;
  discount: number;
  startsAt: number;
  checksum: string;
  priority: number;
  weight: number;
  windowDays: number;
  updatedAt: number;
  status: WeightedConversionBudgetStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    startsAt: number,
    checksum: string,
    priority: number,
    weight: number,
    windowDays: number,
    updatedAt: number,
    status: WeightedConversionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.startsAt = startsAt;
    this.checksum = checksum;
    this.priority = priority;
    this.weight = weight;
    this.windowDays = windowDays;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: WeightedConversionBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedConversionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted conversion budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"weighted conversion budget"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.discount - this.weight) * 100) / 100;
  }

  copy(): WeightedConversionBudget {
    return new WeightedConversionBudget(
      this.code,
      this.label,
      this.discount,
      this.startsAt,
      this.checksum,
      this.priority,
      this.weight,
      this.windowDays,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted conversion budget in status requested. */
export function newWeightedConversionBudget(code: string, label: string): WeightedConversionBudget {
  return new WeightedConversionBudget(code, label, 0, 0, "", 0, 0, 0, 0, "requested");
}
