import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCreativeQuota } from "./adaptive-creative-quota.js";

/** One step of the adaptive creative quota calculation. */
export interface AdaptiveCreativeQuotaStep {
  describe(): string;
  adjust(item: AdaptiveCreativeQuota, value: number): number;
}

export class TieredAdaptiveCreativeQuotaAdjuster implements AdaptiveCreativeQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveCreativeQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveCreativeQuotaAdjuster implements AdaptiveCreativeQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveCreativeQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentAdaptiveCreativeQuotaAdjuster implements AdaptiveCreativeQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveCreativeQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionAdaptiveCreativeQuotaAdjuster implements AdaptiveCreativeQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: AdaptiveCreativeQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveCreativeQuotaVersionOffsetAdjuster implements AdaptiveCreativeQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: AdaptiveCreativeQuota, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the adaptive creative quota steps in order and keeps a trace of each. */
export class AdaptiveCreativeQuotaEngine {
  steps: AdaptiveCreativeQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCreativeQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveCreativeQuota): number {
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

  evaluateAll(items: AdaptiveCreativeQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveCreativeQuotaEngine(): AdaptiveCreativeQuotaEngine {
  return new AdaptiveCreativeQuotaEngine(
    [
      new TieredAdaptiveCreativeQuotaAdjuster([3027, 4023, 4141, 6118], [0.92, 1.03, 0.95, 1.07]),
      new RoundingAdaptiveCreativeQuotaAdjuster(0.25),
      new PercentAdaptiveCreativeQuotaAdjuster(24.2),
      new RegionAdaptiveCreativeQuotaAdjuster(
        new Map<string, number>([["retail", 1], ["west", 1.27], ["north", 1.2]]),
      ),
      new AdaptiveCreativeQuotaVersionOffsetAdjuster(0.64),
    ],
    [],
    3,
    73577,
  );
}
