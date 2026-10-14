import * as numbers from "../../../../kit/numbers.js";
import { StrictWaitMetric } from "./strict-wait-metric.js";

/** One step of the strict wait metric calculation. */
export interface StrictWaitMetricModifier {
  describe(): string;
  adjust(item: StrictWaitMetric, value: number): number;
}

export class RoundingStrictWaitMetricAdjuster implements StrictWaitMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictWaitMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictWaitMetricExpiresAtOffsetAdjuster implements StrictWaitMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: StrictWaitMetric, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class SegmentStrictWaitMetricAdjuster implements StrictWaitMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: StrictWaitMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictWaitMetricAdjuster implements StrictWaitMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictWaitMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStrictWaitMetricAdjuster implements StrictWaitMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictWaitMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictWaitMetricAdjuster implements StrictWaitMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictWaitMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict wait metric steps in order and keeps a trace of each. */
export class StrictWaitMetricEngine {
  steps: StrictWaitMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictWaitMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictWaitMetric): number {
    let current = item.weightedValue();
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

  evaluateAll(items: StrictWaitMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictWaitMetricEngine(): StrictWaitMetricEngine {
  return new StrictWaitMetricEngine(
    [
      new RoundingStrictWaitMetricAdjuster(0.05),
      new StrictWaitMetricExpiresAtOffsetAdjuster(0.83),
      new SegmentStrictWaitMetricAdjuster(new Map<string, number>([["retail", 0.85]])),
      new MinimumStrictWaitMetricAdjuster(15),
      new CapStrictWaitMetricAdjuster(8815),
      new TieredStrictWaitMetricAdjuster([816, 4771, 6316], [1.19, 1.12, 1.02]),
    ],
    [],
    4.6,
    64032.5,
  );
}
