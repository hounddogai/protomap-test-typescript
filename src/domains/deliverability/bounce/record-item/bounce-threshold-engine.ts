import { BounceThreshold } from "./bounce-threshold.js";

/** One step of the bounce threshold calculation. */
export interface BounceThresholdStep {
  describe(): string;
  adjust(item: BounceThreshold, value: number): number;
}

export class TieredBounceThresholdAdjuster implements BounceThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBounceThresholdAdjuster implements BounceThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBounceThresholdAdjuster implements BounceThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryBounceThresholdAdjuster implements BounceThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BounceThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the bounce threshold steps in order and keeps a trace of each. */
export class BounceThresholdEngine {
  steps: BounceThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BounceThreshold): number {
    let current = item.netLoad();
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

  evaluateAll(items: BounceThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBounceThresholdEngine(): BounceThresholdEngine {
  return new BounceThresholdEngine(
    [
      new TieredBounceThresholdAdjuster([896, 3430, 5724], [0.98, 0.91, 1.06]),
      new MinimumBounceThresholdAdjuster(48.2),
      new CapBounceThresholdAdjuster(28098),
      new CategoryBounceThresholdAdjuster(
        new Map<string, number>([["east", 1.37], ["north", 1.24], ["online", 1.16]]),
      ),
    ],
    [],
    4.9,
    9659,
  );
}
