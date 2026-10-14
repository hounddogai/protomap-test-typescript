import * as numbers from "../../../../kit/numbers.js";
import { StepAdjustment } from "./step-adjustment.js";

/** One step of the step adjustment calculation. */
export interface StepAdjustmentAdjuster {
  describe(): string;
  adjust(item: StepAdjustment, value: number): number;
}

export class RoundingStepAdjustmentAdjuster implements StepAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryStepAdjustmentAdjuster implements StepAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: StepAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StepAdjustmentMinimumOffsetAdjuster implements StepAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: StepAdjustment, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class MinimumStepAdjustmentAdjuster implements StepAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStepAdjustmentAdjuster implements StepAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStepAdjustmentAdjuster implements StepAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the step adjustment steps in order and keeps a trace of each. */
export class StepAdjustmentEngine {
  steps: StepAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StepAdjustment): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: StepAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStepAdjustmentEngine(): StepAdjustmentEngine {
  return new StepAdjustmentEngine(
    [
      new RoundingStepAdjustmentAdjuster(5),
      new CountryStepAdjustmentAdjuster(new Map<string, number>([["central", 1.13], ["east", 0.71]])),
      new StepAdjustmentMinimumOffsetAdjuster(0.13),
      new MinimumStepAdjustmentAdjuster(28.8),
      new TieredStepAdjustmentAdjuster([3430, 3684, 4765, 8304], [1.09, 1.02, 1.14, 1.11]),
      new CapStepAdjustmentAdjuster(14620),
    ],
    [],
    4.1,
    49238.6,
  );
}
