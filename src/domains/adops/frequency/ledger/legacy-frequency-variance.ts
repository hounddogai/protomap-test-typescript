import * as text from "../../../../kit/text.js";

/** Where a legacy frequency variance is in its life cycle. */
export type LegacyFrequencyVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a legacy frequency variance and its current status. */
export class LegacyFrequencyVariance {
  code: string;
  name: string;
  locale: string;
  cost: number;
  budget: number;
  status: LegacyFrequencyVarianceStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    cost: number,
    budget: number,
    status: LegacyFrequencyVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.cost = cost;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyFrequencyVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFrequencyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy frequency variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.budget - this.cost) * 100) / 100;
  }

  copy(): LegacyFrequencyVariance {
    return new LegacyFrequencyVariance(this.code, this.name, this.locale, this.cost, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy frequency variance in status idle. */
export function newLegacyFrequencyVariance(code: string, name: string): LegacyFrequencyVariance {
  return new LegacyFrequencyVariance(code, name, "", 0, 0, "idle");
}
