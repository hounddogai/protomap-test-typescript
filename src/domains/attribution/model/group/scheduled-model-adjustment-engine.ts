import * as numbers from "../../../../kit/numbers.js";
import { ScheduledModelAdjustment } from "./scheduled-model-adjustment.js";

/** One step of the scheduled model adjustment calculation. */
export interface ScheduledModelAdjustmentStep {
  describe(): string;
  adjust(item: ScheduledModelAdjustment, value: number): number;
}

export class CapScheduledModelAdjustmentAdjuster implements ScheduledModelAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledModelAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledModelAdjustmentAdjuster implements ScheduledModelAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledModelAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledModelAdjustmentAdjuster implements ScheduledModelAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledModelAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledModelAdjustmentAdjuster implements ScheduledModelAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledModelAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledModelAdjustmentAdjuster implements ScheduledModelAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledModelAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled model adjustment steps in order and keeps a trace of each. */
export class ScheduledModelAdjustmentEngine {
  steps: ScheduledModelAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledModelAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledModelAdjustment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ScheduledModelAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledModelAdjustmentEngine(): ScheduledModelAdjustmentEngine {
  return new ScheduledModelAdjustmentEngine(
    [
      new CapScheduledModelAdjustmentAdjuster(3427),
      new PercentScheduledModelAdjustmentAdjuster(-8.1),
      new MinimumScheduledModelAdjustmentAdjuster(39),
      new TieredScheduledModelAdjustmentAdjuster([2126, 5015, 9898], [1.06, 1.02, 1.05]),
      new RoundingScheduledModelAdjustmentAdjuster(5),
    ],
    [],
    1.4,
    54349,
  );
}
