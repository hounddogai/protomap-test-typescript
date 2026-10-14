import { FallbackPathMetric } from "./fallback-path-metric.js";

/** One step of the fallback path metric calculation. */
export interface FallbackPathMetricModifier {
  describe(): string;
  adjust(item: FallbackPathMetric, value: number): number;
}

export class CapFallbackPathMetricAdjuster implements FallbackPathMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPathMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackPathMetricAdjuster implements FallbackPathMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPathMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentFallbackPathMetricAdjuster implements FallbackPathMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPathMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelFallbackPathMetricAdjuster implements FallbackPathMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackPathMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackPathMetricBidOffsetAdjuster implements FallbackPathMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: FallbackPathMetric, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the fallback path metric steps in order and keeps a trace of each. */
export class FallbackPathMetricEngine {
  steps: FallbackPathMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPathMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackPathMetric): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: FallbackPathMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackPathMetricEngine(): FallbackPathMetricEngine {
  return new FallbackPathMetricEngine(
    [
      new CapFallbackPathMetricAdjuster(24037),
      new TieredFallbackPathMetricAdjuster([2846, 3841, 3895, 7680], [1.06, 0.92, 0.99, 1.06]),
      new PercentFallbackPathMetricAdjuster(7.3),
      new LabelFallbackPathMetricAdjuster(
        new Map<string, number>([["west", 1.3], ["central", 1.22], ["north", 1.3]]),
      ),
      new FallbackPathMetricBidOffsetAdjuster(1.14),
    ],
    [],
    2.6,
    29211,
  );
}
