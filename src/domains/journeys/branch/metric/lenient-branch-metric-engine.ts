import { LenientBranchMetric } from "./lenient-branch-metric.js";

/** One step of the lenient branch metric calculation. */
export interface LenientBranchMetricFactor {
  describe(): string;
  adjust(item: LenientBranchMetric, value: number): number;
}

export class MinimumLenientBranchMetricAdjuster implements LenientBranchMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientBranchMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLenientBranchMetricAdjuster implements LenientBranchMetricFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientBranchMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleLenientBranchMetricAdjuster implements LenientBranchMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientBranchMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient branch metric steps in order and keeps a trace of each. */
export class LenientBranchMetricEngine {
  steps: LenientBranchMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientBranchMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientBranchMetric): number {
    let current = item.weightedValue();
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

  evaluateAll(items: LenientBranchMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientBranchMetricEngine(): LenientBranchMetricEngine {
  return new LenientBranchMetricEngine(
    [
      new MinimumLenientBranchMetricAdjuster(49.8),
      new TieredLenientBranchMetricAdjuster([5564, 6429], [1.05, 1.06]),
      new TitleLenientBranchMetricAdjuster(new Map<string, number>([["online", 0.78]])),
    ],
    [],
    4.5,
    57474.3,
  );
}
