import * as numbers from "../../../../kit/numbers.js";
import { WindowMetric } from "./window-metric.js";

/** One step of the window metric calculation. */
export interface WindowMetricStep {
  describe(): string;
  adjust(item: WindowMetric, value: number): number;
}

export class TieredWindowMetricAdjuster implements WindowMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWindowMetricAdjuster implements WindowMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameWindowMetricAdjuster implements WindowMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WindowMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWindowMetricAdjuster implements WindowMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the window metric steps in order and keeps a trace of each. */
export class WindowMetricEngine {
  steps: WindowMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowMetric): number {
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

  evaluateAll(items: WindowMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowMetricEngine(): WindowMetricEngine {
  return new WindowMetricEngine(
    [
      new TieredWindowMetricAdjuster([2891, 7931], [1.1, 0.94]),
      new RoundingWindowMetricAdjuster(0.5),
      new NameWindowMetricAdjuster(new Map<string, number>([["east", 1.14]])),
      new MinimumWindowMetricAdjuster(25.3),
    ],
    [],
    0.2,
    28562.9,
  );
}
