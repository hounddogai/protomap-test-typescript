import * as flags from "../../../../kit/flags.js";
import { AdaptivePayoutQuota } from "./adaptive-payout-quota.js";

/** One step of the adaptive payout quota calculation. */
export interface AdaptivePayoutQuotaAdjuster {
  describe(): string;
  adjust(item: AdaptivePayoutQuota, value: number): number;
}

export class TieredAdaptivePayoutQuotaAdjuster implements AdaptivePayoutQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePayoutQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptivePayoutQuotaAdjuster implements AdaptivePayoutQuotaAdjuster {
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

  adjust(item: AdaptivePayoutQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptivePayoutQuotaAdjuster implements AdaptivePayoutQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePayoutQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryAdaptivePayoutQuotaAdjuster implements AdaptivePayoutQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: AdaptivePayoutQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptivePayoutQuotaAdjuster implements AdaptivePayoutQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptivePayoutQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive payout quota steps in order and keeps a trace of each. */
export class AdaptivePayoutQuotaEngine {
  steps: AdaptivePayoutQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePayoutQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptivePayoutQuota): number {
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

  evaluateAll(items: AdaptivePayoutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptivePayoutQuotaEngine(flagsValue: flags.Registry): AdaptivePayoutQuotaEngine {
  return new AdaptivePayoutQuotaEngine(
    [
      new TieredAdaptivePayoutQuotaAdjuster([2007, 4422, 7356], [1.09, 1.13, 0.95]),
      new FlaggedAdaptivePayoutQuotaAdjuster(flagsValue, "adaptive-payout-quota-lenient", -3.1),
      new PercentAdaptivePayoutQuotaAdjuster(-14.3),
      new CountryAdaptivePayoutQuotaAdjuster(new Map<string, number>([["central", 1.11], ["west", 0.96]])),
      new CapAdaptivePayoutQuotaAdjuster(47145),
    ],
    [],
    3.8,
    74365.2,
  );
}
