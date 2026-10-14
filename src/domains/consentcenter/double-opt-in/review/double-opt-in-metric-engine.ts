import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInMetric } from "./double-opt-in-metric.js";

/** One step of the double opt in metric calculation. */
export interface DoubleOptInMetricFactor {
  describe(): string;
  adjust(item: DoubleOptInMetric, value: number): number;
}

export class RegionDoubleOptInMetricAdjuster implements DoubleOptInMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: DoubleOptInMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDoubleOptInMetricAdjuster implements DoubleOptInMetricFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDoubleOptInMetricAdjuster implements DoubleOptInMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDoubleOptInMetricAdjuster implements DoubleOptInMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the double opt in metric steps in order and keeps a trace of each. */
export class DoubleOptInMetricEngine {
  steps: DoubleOptInMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInMetric): number {
    let current = item.netExposure();
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

  evaluateAll(items: DoubleOptInMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInMetricEngine(): DoubleOptInMetricEngine {
  return new DoubleOptInMetricEngine(
    [
      new RegionDoubleOptInMetricAdjuster(new Map<string, number>([["retail", 1.11]])),
      new RoundingDoubleOptInMetricAdjuster(0.1),
      new MinimumDoubleOptInMetricAdjuster(45.9),
      new CapDoubleOptInMetricAdjuster(23705),
    ],
    [],
    2.4,
    99537.9,
  );
}
