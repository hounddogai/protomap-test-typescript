import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackPathQuota } from "./fallback-path-quota.js";

/** One step of the fallback path quota calculation. */
export interface FallbackPathQuotaModifier {
  describe(): string;
  adjust(item: FallbackPathQuota, value: number): number;
}

export class PercentFallbackPathQuotaAdjuster implements FallbackPathQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPathQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFallbackPathQuotaAdjuster implements FallbackPathQuotaModifier {
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

  adjust(item: FallbackPathQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackPathQuotaAdjuster implements FallbackPathQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPathQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackPathQuotaAdjuster implements FallbackPathQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPathQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFallbackPathQuotaAdjuster implements FallbackPathQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackPathQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFallbackPathQuotaAdjuster implements FallbackPathQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPathQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback path quota steps in order and keeps a trace of each. */
export class FallbackPathQuotaEngine {
  steps: FallbackPathQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPathQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackPathQuota): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackPathQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackPathQuotaEngine(flagsValue: flags.Registry): FallbackPathQuotaEngine {
  return new FallbackPathQuotaEngine(
    [
      new PercentFallbackPathQuotaAdjuster(4.9),
      new FlaggedFallbackPathQuotaAdjuster(flagsValue, "fallback-path-quota-primary", -2.8),
      new RoundingFallbackPathQuotaAdjuster(0.05),
      new TieredFallbackPathQuotaAdjuster([1500, 1518, 2620, 9916], [1.16, 1.04, 1, 0.95]),
      new MinimumFallbackPathQuotaAdjuster(38.7),
      new CapFallbackPathQuotaAdjuster(23841),
    ],
    [],
    0.4,
    49535.3,
  );
}
