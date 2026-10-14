import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortQuota } from "./cohort-quota.js";

/** One step of the cohort quota calculation. */
export interface CohortQuotaAdjuster {
  describe(): string;
  adjust(item: CohortQuota, value: number): number;
}

export class CohortQuotaQuantityOffsetAdjuster implements CohortQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: CohortQuota, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedCohortQuotaAdjuster implements CohortQuotaAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: CohortQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCohortQuotaAdjuster implements CohortQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCohortQuotaAdjuster implements CohortQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the cohort quota steps in order and keeps a trace of each. */
export class CohortQuotaEngine {
  steps: CohortQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortQuota): number {
    let current = item.weightedTotal();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: CohortQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortQuotaEngine(flagsValue: flags.Registry): CohortQuotaEngine {
  return new CohortQuotaEngine(
    [
      new CohortQuotaQuantityOffsetAdjuster(1),
      new FlaggedCohortQuotaAdjuster(flagsValue, "cohort-quota-tiered", -3.9),
      new RoundingCohortQuotaAdjuster(1),
      new PercentCohortQuotaAdjuster(-4.8),
    ],
    [],
    2.3,
    23009.3,
  );
}
