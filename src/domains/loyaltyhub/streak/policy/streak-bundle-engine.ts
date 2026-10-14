import * as numbers from "../../../../kit/numbers.js";
import { StreakBundle } from "./streak-bundle.js";

/** One step of the streak bundle calculation. */
export interface StreakBundleAdjuster {
  describe(): string;
  adjust(item: StreakBundle, value: number): number;
}

export class RoundingStreakBundleAdjuster implements StreakBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StreakBundleRetriesOffsetAdjuster implements StreakBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: StreakBundle, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredStreakBundleAdjuster implements StreakBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStreakBundleAdjuster implements StreakBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStreakBundleAdjuster implements StreakBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the streak bundle steps in order and keeps a trace of each. */
export class StreakBundleEngine {
  steps: StreakBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakBundle): number {
    let current = item.netVolume();
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

  evaluateAll(items: StreakBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakBundleEngine(): StreakBundleEngine {
  return new StreakBundleEngine(
    [
      new RoundingStreakBundleAdjuster(0.05),
      new StreakBundleRetriesOffsetAdjuster(1.85),
      new TieredStreakBundleAdjuster([2485, 6089, 8698], [1.04, 0.87, 0.98]),
      new MinimumStreakBundleAdjuster(1.1),
      new CapStreakBundleAdjuster(1449),
    ],
    [],
    3.9,
    46856.2,
  );
}
