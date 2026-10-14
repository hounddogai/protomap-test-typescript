import { GlobalSuppressionVariance } from "./global-suppression-variance.js";

/** One step of the global suppression variance calculation. */
export interface GlobalSuppressionVarianceFactor {
  describe(): string;
  adjust(item: GlobalSuppressionVariance, value: number): number;
}

export class PercentGlobalSuppressionVarianceAdjuster implements GlobalSuppressionVarianceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSuppressionVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalSuppressionVarianceAdjuster implements GlobalSuppressionVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSuppressionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalSuppressionVarianceExpiresAtOffsetAdjuster implements GlobalSuppressionVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: GlobalSuppressionVariance, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumGlobalSuppressionVarianceAdjuster implements GlobalSuppressionVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalSuppressionVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentGlobalSuppressionVarianceAdjuster implements GlobalSuppressionVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: GlobalSuppressionVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalSuppressionVarianceAdjuster implements GlobalSuppressionVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalSuppressionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global suppression variance steps in order and keeps a trace of each. */
export class GlobalSuppressionVarianceEngine {
  steps: GlobalSuppressionVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSuppressionVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalSuppressionVariance): number {
    let current = item.netTotal();
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

  evaluateAll(items: GlobalSuppressionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalSuppressionVarianceEngine(): GlobalSuppressionVarianceEngine {
  return new GlobalSuppressionVarianceEngine(
    [
      new PercentGlobalSuppressionVarianceAdjuster(21.3),
      new TieredGlobalSuppressionVarianceAdjuster([2823, 3180, 5007], [0.97, 0.88, 1.17]),
      new GlobalSuppressionVarianceExpiresAtOffsetAdjuster(0.61),
      new MinimumGlobalSuppressionVarianceAdjuster(42.3),
      new SegmentGlobalSuppressionVarianceAdjuster(new Map<string, number>([["central", 1.19]])),
      new CapGlobalSuppressionVarianceAdjuster(41291),
    ],
    [],
    4.8,
    82927.9,
  );
}
