import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedRetentionAllocation } from "./weighted-retention-allocation.js";

/** One step of the weighted retention allocation calculation. */
export interface WeightedRetentionAllocationFactor {
  describe(): string;
  adjust(item: WeightedRetentionAllocation, value: number): number;
}

export class FlaggedWeightedRetentionAllocationAdjuster implements WeightedRetentionAllocationFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WeightedRetentionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedRetentionAllocationAdjuster implements WeightedRetentionAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedRetentionAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWeightedRetentionAllocationAdjuster implements WeightedRetentionAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRetentionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleWeightedRetentionAllocationAdjuster implements WeightedRetentionAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedRetentionAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWeightedRetentionAllocationAdjuster implements WeightedRetentionAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRetentionAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWeightedRetentionAllocationAdjuster implements WeightedRetentionAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedRetentionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted retention allocation steps in order and keeps a trace of each. */
export class WeightedRetentionAllocationEngine {
  steps: WeightedRetentionAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRetentionAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedRetentionAllocation): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: WeightedRetentionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedRetentionAllocationEngine(flagsValue: flags.Registry): WeightedRetentionAllocationEngine {
  return new WeightedRetentionAllocationEngine(
    [
      new FlaggedWeightedRetentionAllocationAdjuster(flagsValue, "weighted-retention-allocation-legacy", -4.2),
      new CapWeightedRetentionAllocationAdjuster(48954),
      new MinimumWeightedRetentionAllocationAdjuster(27.3),
      new TitleWeightedRetentionAllocationAdjuster(
        new Map<string, number>([["east", 1.18], ["retail", 1.09], ["online", 0.84]]),
      ),
      new RoundingWeightedRetentionAllocationAdjuster(0.05),
      new TieredWeightedRetentionAllocationAdjuster([2732, 3531, 5883], [0.99, 0.91, 0.94]),
    ],
    [],
    1.1,
    51937.1,
  );
}
