import * as numbers from "../../../../kit/numbers.js";
import { FrequencyAdjustment } from "./frequency-adjustment.js";

/** One step of the frequency adjustment calculation. */
export interface FrequencyAdjustmentAdjuster {
  describe(): string;
  adjust(item: FrequencyAdjustment, value: number): number;
}

export class PercentFrequencyAdjustmentAdjuster implements FrequencyAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFrequencyAdjustmentAdjuster implements FrequencyAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FrequencyAdjustmentQuantityOffsetAdjuster implements FrequencyAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: FrequencyAdjustment, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class UnitFrequencyAdjustmentAdjuster implements FrequencyAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: FrequencyAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFrequencyAdjustmentAdjuster implements FrequencyAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the frequency adjustment steps in order and keeps a trace of each. */
export class FrequencyAdjustmentEngine {
  steps: FrequencyAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FrequencyAdjustment): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: FrequencyAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFrequencyAdjustmentEngine(): FrequencyAdjustmentEngine {
  return new FrequencyAdjustmentEngine(
    [
      new PercentFrequencyAdjustmentAdjuster(4),
      new RoundingFrequencyAdjustmentAdjuster(0.1),
      new FrequencyAdjustmentQuantityOffsetAdjuster(0.13),
      new UnitFrequencyAdjustmentAdjuster(new Map<string, number>([["east", 1.39], ["online", 0.9]])),
      new MinimumFrequencyAdjustmentAdjuster(22.7),
    ],
    [],
    4.6,
    55705.8,
  );
}
