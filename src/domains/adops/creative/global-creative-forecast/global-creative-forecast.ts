/**
 * The global creative forecast records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global creative forecast is in its life cycle. */
export type GlobalCreativeForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global creative forecast. Its code is unique within a tenant. */
export class GlobalCreativeForecast {
  code: string;
  name: string;
  limit: number;
  ratio: number;
  graceDays: number;
  campaignRef: string;
  region: string;
  windowDays: number;
  approved: boolean;
  weight: number;
  unit: string;
  status: GlobalCreativeForecastStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    ratio: number,
    graceDays: number,
    campaignRef: string,
    region: string,
    windowDays: number,
    approved: boolean,
    weight: number,
    unit: string,
    status: GlobalCreativeForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.campaignRef = campaignRef;
    this.region = region;
    this.windowDays = windowDays;
    this.approved = approved;
    this.weight = weight;
    this.unit = unit;
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

  canMoveTo(next: GlobalCreativeForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalCreativeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global creative forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.limit + this.graceDays) * 100) / 100;
  }

  copy(): GlobalCreativeForecast {
    return new GlobalCreativeForecast(
      this.code,
      this.name,
      this.limit,
      this.ratio,
      this.graceDays,
      this.campaignRef,
      this.region,
      this.windowDays,
      this.approved,
      this.weight,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global creative forecast in status planned. */
export function newGlobalCreativeForecast(code: string, name: string): GlobalCreativeForecast {
  return new GlobalCreativeForecast(code, name, 0, 0, 0, "", "", 0, false, 0, "", "planned");
}
