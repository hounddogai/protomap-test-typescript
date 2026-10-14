import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedWaitQuota } from "./weighted-wait-quota.js";

/** One step of the weighted wait quota calculation. */
export interface WeightedWaitQuotaStep {
  describe(): string;
  adjust(item: WeightedWaitQuota, value: number): number;
}

export class PercentWeightedWaitQuotaAdjuster implements WeightedWaitQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWaitQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedWaitQuotaAdjuster implements WeightedWaitQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedWaitQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWeightedWaitQuotaAdjuster implements WeightedWaitQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedWaitQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWeightedWaitQuotaAdjuster implements WeightedWaitQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWaitQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedWaitQuotaAdjuster implements WeightedWaitQuotaStep {
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

  adjust(item: WeightedWaitQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedWaitQuotaPriorityOffsetAdjuster implements WeightedWaitQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: WeightedWaitQuota, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the weighted wait quota steps in order and keeps a trace of each. */
export class WeightedWaitQuotaEngine {
  steps: WeightedWaitQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWaitQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedWaitQuota): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: WeightedWaitQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedWaitQuotaEngine(flagsValue: flags.Registry): WeightedWaitQuotaEngine {
  return new WeightedWaitQuotaEngine(
    [
      new PercentWeightedWaitQuotaAdjuster(20.4),
      new MinimumWeightedWaitQuotaAdjuster(40.6),
      new TieredWeightedWaitQuotaAdjuster([119, 1022, 4401], [1.13, 0.94, 0.92]),
      new CapWeightedWaitQuotaAdjuster(24676),
      new FlaggedWeightedWaitQuotaAdjuster(flagsValue, "weighted-wait-quota-rolling", -8.1),
      new WeightedWaitQuotaPriorityOffsetAdjuster(1.84),
    ],
    [],
    4.9,
    95178.4,
  );
}
