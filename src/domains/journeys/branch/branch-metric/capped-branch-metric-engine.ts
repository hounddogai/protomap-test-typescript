import { CappedBranchMetric } from "./capped-branch-metric.js";

/** One step of the capped branch metric calculation. */
export interface CappedBranchMetricModifier {
  describe(): string;
  adjust(item: CappedBranchMetric, value: number): number;
}

export class TieredCappedBranchMetricAdjuster implements CappedBranchMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedBranchMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedBranchMetricAdjuster implements CappedBranchMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedBranchMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionCappedBranchMetricAdjuster implements CappedBranchMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CappedBranchMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCappedBranchMetricAdjuster implements CappedBranchMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedBranchMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedBranchMetricAdjuster implements CappedBranchMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedBranchMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped branch metric steps in order and keeps a trace of each. */
export class CappedBranchMetricEngine {
  steps: CappedBranchMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedBranchMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedBranchMetric): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CappedBranchMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedBranchMetricEngine(): CappedBranchMetricEngine {
  return new CappedBranchMetricEngine(
    [
      new TieredCappedBranchMetricAdjuster([6482, 8660, 8951], [0.93, 1.02, 1.14]),
      new MinimumCappedBranchMetricAdjuster(23.1),
      new RegionCappedBranchMetricAdjuster(new Map<string, number>([["north", 0.81]])),
      new PercentCappedBranchMetricAdjuster(4.4),
      new CapCappedBranchMetricAdjuster(44183),
    ],
    [],
    1.9,
    25487.2,
  );
}
