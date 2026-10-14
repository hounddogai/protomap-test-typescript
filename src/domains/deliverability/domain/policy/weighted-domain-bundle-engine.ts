import * as numbers from "../../../../kit/numbers.js";
import { WeightedDomainBundle } from "./weighted-domain-bundle.js";

/** One step of the weighted domain bundle calculation. */
export interface WeightedDomainBundleFactor {
  describe(): string;
  adjust(item: WeightedDomainBundle, value: number): number;
}

export class RoundingWeightedDomainBundleAdjuster implements WeightedDomainBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedDomainBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionWeightedDomainBundleAdjuster implements WeightedDomainBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: WeightedDomainBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedDomainBundleAdjuster implements WeightedDomainBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedDomainBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted domain bundle steps in order and keeps a trace of each. */
export class WeightedDomainBundleEngine {
  steps: WeightedDomainBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedDomainBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedDomainBundle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedDomainBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedDomainBundleEngine(): WeightedDomainBundleEngine {
  return new WeightedDomainBundleEngine(
    [
      new RoundingWeightedDomainBundleAdjuster(1),
      new RegionWeightedDomainBundleAdjuster(new Map<string, number>([["north", 1.02]])),
      new CapWeightedDomainBundleAdjuster(21833),
    ],
    [],
    4.1,
    40091.6,
  );
}
