import * as numbers from "../../../../kit/numbers.js";
import { StepMetric } from "./step-metric.js";

/** One step of the step metric calculation. */
export interface StepMetricFactor {
  describe(): string;
  adjust(item: StepMetric, value: number): number;
}

export class RoundingStepMetricAdjuster implements StepMetricFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StepMetricAmountOffsetAdjuster implements StepMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: StepMetric, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class TieredStepMetricAdjuster implements StepMetricFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStepMetricAdjuster implements StepMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStepMetricAdjuster implements StepMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the step metric steps in order and keeps a trace of each. */
export class StepMetricEngine {
  steps: StepMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepMetric): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: StepMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepMetricEngine(): StepMetricEngine {
  return new StepMetricEngine(
    [
      new RoundingStepMetricAdjuster(5),
      new StepMetricAmountOffsetAdjuster(0.76),
      new TieredStepMetricAdjuster([3493, 4201, 5900], [0.98, 1.14, 1.15]),
      new MinimumStepMetricAdjuster(15.7),
      new CapStepMetricAdjuster(1667),
    ],
    [],
    0.9,
    9814.3,
  );
}
