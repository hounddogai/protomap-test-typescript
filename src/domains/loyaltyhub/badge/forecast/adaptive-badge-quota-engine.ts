import * as flags from "../../../../kit/flags.js";
import { AdaptiveBadgeQuota } from "./adaptive-badge-quota.js";

/** One step of the adaptive badge quota calculation. */
export interface AdaptiveBadgeQuotaStep {
  describe(): string;
  adjust(item: AdaptiveBadgeQuota, value: number): number;
}

export class FlaggedAdaptiveBadgeQuotaAdjuster implements AdaptiveBadgeQuotaStep {
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

  adjust(item: AdaptiveBadgeQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveBadgeQuotaAdjuster implements AdaptiveBadgeQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveBadgeQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveBadgeQuotaAdjuster implements AdaptiveBadgeQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveBadgeQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive badge quota steps in order and keeps a trace of each. */
export class AdaptiveBadgeQuotaEngine {
  steps: AdaptiveBadgeQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBadgeQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveBadgeQuota): number {
    let current = item.adjustedExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: AdaptiveBadgeQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveBadgeQuotaEngine(flagsValue: flags.Registry): AdaptiveBadgeQuotaEngine {
  return new AdaptiveBadgeQuotaEngine(
    [
      new FlaggedAdaptiveBadgeQuotaAdjuster(flagsValue, "adaptive-badge-quota-pending", 9.2),
      new PercentAdaptiveBadgeQuotaAdjuster(-4),
      new TieredAdaptiveBadgeQuotaAdjuster([7135, 8020], [1.17, 0.84]),
    ],
    [],
    4.6,
    45588.9,
  );
}
