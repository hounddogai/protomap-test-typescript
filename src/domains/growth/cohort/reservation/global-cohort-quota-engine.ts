import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalCohortQuota } from "./global-cohort-quota.js";

/** One step of the global cohort quota calculation. */
export interface GlobalCohortQuotaStep {
  describe(): string;
  adjust(item: GlobalCohortQuota, value: number): number;
}

export class MinimumGlobalCohortQuotaAdjuster implements GlobalCohortQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalCohortQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleGlobalCohortQuotaAdjuster implements GlobalCohortQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: GlobalCohortQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class GlobalCohortQuotaExpiresAtOffsetAdjuster implements GlobalCohortQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: GlobalCohortQuota, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class FlaggedGlobalCohortQuotaAdjuster implements GlobalCohortQuotaStep {
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

  adjust(item: GlobalCohortQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentGlobalCohortQuotaAdjuster implements GlobalCohortQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCohortQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global cohort quota steps in order and keeps a trace of each. */
export class GlobalCohortQuotaEngine {
  steps: GlobalCohortQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCohortQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalCohortQuota): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: GlobalCohortQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalCohortQuotaEngine(flagsValue: flags.Registry): GlobalCohortQuotaEngine {
  return new GlobalCohortQuotaEngine(
    [
      new MinimumGlobalCohortQuotaAdjuster(4.8),
      new LocaleGlobalCohortQuotaAdjuster(new Map<string, number>([["west", 1.15]])),
      new GlobalCohortQuotaExpiresAtOffsetAdjuster(1.06),
      new FlaggedGlobalCohortQuotaAdjuster(flagsValue, "global-cohort-quota-global", -8.9),
      new PercentGlobalCohortQuotaAdjuster(-10.6),
    ],
    [],
    3.7,
    66336.1,
  );
}
