import * as numbers from "../../../../kit/numbers.js";
import { FallbackRetentionBundle } from "./fallback-retention-bundle.js";

/** One step of the fallback retention bundle calculation. */
export interface FallbackRetentionBundleStep {
  describe(): string;
  adjust(item: FallbackRetentionBundle, value: number): number;
}

export class TieredFallbackRetentionBundleAdjuster implements FallbackRetentionBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackRetentionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFallbackRetentionBundleAdjuster implements FallbackRetentionBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackRetentionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFallbackRetentionBundleAdjuster implements FallbackRetentionBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackRetentionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackRetentionBundleAdjuster implements FallbackRetentionBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackRetentionBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFallbackRetentionBundleAdjuster implements FallbackRetentionBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackRetentionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackRetentionBundlePriorityOffsetAdjuster implements FallbackRetentionBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FallbackRetentionBundle, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the fallback retention bundle steps in order and keeps a trace of each. */
export class FallbackRetentionBundleEngine {
  steps: FallbackRetentionBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRetentionBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackRetentionBundle): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: FallbackRetentionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackRetentionBundleEngine(): FallbackRetentionBundleEngine {
  return new FallbackRetentionBundleEngine(
    [
      new TieredFallbackRetentionBundleAdjuster([7118, 7973], [1.18, 0.94]),
      new RoundingFallbackRetentionBundleAdjuster(0.25),
      new PercentFallbackRetentionBundleAdjuster(14.4),
      new MinimumFallbackRetentionBundleAdjuster(11.5),
      new CapFallbackRetentionBundleAdjuster(5507),
      new FallbackRetentionBundlePriorityOffsetAdjuster(0.61),
    ],
    [],
    4.2,
    69795.2,
  );
}
