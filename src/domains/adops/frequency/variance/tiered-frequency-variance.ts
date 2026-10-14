/**
 * The tiered frequency variance records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered frequency variance is in its life cycle. */
export type TieredFrequencyVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered frequency variance, with what the planners need to act on it. */
export class TieredFrequencyVariance {
  code: string;
  name: string;
  discount: number;
  openRate: number;
  utmSource: string;
  updatedAt: number;
  status: TieredFrequencyVarianceStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    openRate: number,
    utmSource: string,
    updatedAt: number,
    status: TieredFrequencyVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: TieredFrequencyVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredFrequencyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered frequency variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered frequency variance"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.openRate + this.discount) * 100) / 100;
  }

  copy(): TieredFrequencyVariance {
    return new TieredFrequencyVariance(
      this.code,
      this.name,
      this.discount,
      this.openRate,
      this.utmSource,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered frequency variance in status new. */
export function newTieredFrequencyVariance(code: string, name: string): TieredFrequencyVariance {
  return new TieredFrequencyVariance(code, name, 0, 0, "", 0, "new");
}
