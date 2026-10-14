import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInOverride } from "./double-opt-in-override.js";

/** One step of the double opt in override calculation. */
export interface DoubleOptInOverrideFactor {
  describe(): string;
  adjust(item: DoubleOptInOverride, value: number): number;
}

export class MinimumDoubleOptInOverrideAdjuster implements DoubleOptInOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDoubleOptInOverrideAdjuster implements DoubleOptInOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDoubleOptInOverrideAdjuster implements DoubleOptInOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DoubleOptInOverrideBatchSizeOffsetAdjuster implements DoubleOptInOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: DoubleOptInOverride, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingDoubleOptInOverrideAdjuster implements DoubleOptInOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDoubleOptInOverrideAdjuster implements DoubleOptInOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in override steps in order and keeps a trace of each. */
export class DoubleOptInOverrideEngine {
  steps: DoubleOptInOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DoubleOptInOverride): number {
    let current = item.netTotal();
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

  evaluateAll(items: DoubleOptInOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDoubleOptInOverrideEngine(): DoubleOptInOverrideEngine {
  return new DoubleOptInOverrideEngine(
    [
      new MinimumDoubleOptInOverrideAdjuster(13.1),
      new TieredDoubleOptInOverrideAdjuster([6006, 8590], [1.11, 1.05]),
      new CapDoubleOptInOverrideAdjuster(3196),
      new DoubleOptInOverrideBatchSizeOffsetAdjuster(0.31),
      new RoundingDoubleOptInOverrideAdjuster(1),
      new PercentDoubleOptInOverrideAdjuster(16.6),
    ],
    [],
    0.8,
    53281.7,
  );
}
