import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedSenderQuota } from "./weighted-sender-quota.js";

/** One step of the weighted sender quota calculation. */
export interface WeightedSenderQuotaStep {
  describe(): string;
  adjust(item: WeightedSenderQuota, value: number): number;
}

export class MinimumWeightedSenderQuotaAdjuster implements WeightedSenderQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedSenderQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedSenderQuotaAdjuster implements WeightedSenderQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedSenderQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedSenderQuotaAdjuster implements WeightedSenderQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedSenderQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedSenderQuotaAdjuster implements WeightedSenderQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedSenderQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWeightedSenderQuotaAdjuster implements WeightedSenderQuotaStep {
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

  adjust(item: WeightedSenderQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted sender quota steps in order and keeps a trace of each. */
export class WeightedSenderQuotaEngine {
  steps: WeightedSenderQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedSenderQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedSenderQuota): number {
    let current = item.netVolume();
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

  evaluateAll(items: WeightedSenderQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedSenderQuotaEngine(flagsValue: flags.Registry): WeightedSenderQuotaEngine {
  return new WeightedSenderQuotaEngine(
    [
      new MinimumWeightedSenderQuotaAdjuster(48.5),
      new RoundingWeightedSenderQuotaAdjuster(5),
      new PercentWeightedSenderQuotaAdjuster(6.2),
      new TieredWeightedSenderQuotaAdjuster([2626, 2830, 7074, 8117], [1.12, 0.97, 0.82, 0.82]),
      new FlaggedWeightedSenderQuotaAdjuster(flagsValue, "weighted-sender-quota-pending", 3.9),
    ],
    [],
    2.3,
    40153.9,
  );
}
