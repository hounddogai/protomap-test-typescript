import * as numbers from "../../../../kit/numbers.js";
import { StrictModelAdjustment } from "./strict-model-adjustment.js";

/** One step of the strict model adjustment calculation. */
export interface StrictModelAdjustmentStep {
  describe(): string;
  adjust(item: StrictModelAdjustment, value: number): number;
}

export class TieredStrictModelAdjustmentAdjuster implements StrictModelAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictModelAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictModelAdjustmentAdjuster implements StrictModelAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictModelAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictModelAdjustmentAdjuster implements StrictModelAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictModelAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictModelAdjustmentAdjuster implements StrictModelAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictModelAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict model adjustment steps in order and keeps a trace of each. */
export class StrictModelAdjustmentEngine {
  steps: StrictModelAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictModelAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictModelAdjustment): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StrictModelAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictModelAdjustmentEngine(): StrictModelAdjustmentEngine {
  return new StrictModelAdjustmentEngine(
    [
      new TieredStrictModelAdjustmentAdjuster([651, 1117, 2036], [1, 1.07, 1.07]),
      new RoundingStrictModelAdjustmentAdjuster(0.25),
      new PercentStrictModelAdjustmentAdjuster(6.7),
      new MinimumStrictModelAdjustmentAdjuster(26),
    ],
    [],
    0.5,
    11111.2,
  );
}
