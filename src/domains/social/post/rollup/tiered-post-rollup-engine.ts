import * as numbers from "../../../../kit/numbers.js";
import { TieredPostRollup } from "./tiered-post-rollup.js";

/** One step of the tiered post rollup calculation. */
export interface TieredPostRollupStep {
  describe(): string;
  adjust(item: TieredPostRollup, value: number): number;
}

export class PercentTieredPostRollupAdjuster implements TieredPostRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPostRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPostRollupWeightOffsetAdjuster implements TieredPostRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: TieredPostRollup, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class RoundingTieredPostRollupAdjuster implements TieredPostRollupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredPostRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredPostRollupAdjuster implements TieredPostRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPostRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredPostRollupAdjuster implements TieredPostRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredPostRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered post rollup steps in order and keeps a trace of each. */
export class TieredPostRollupEngine {
  steps: TieredPostRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPostRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredPostRollup): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: TieredPostRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredPostRollupEngine(): TieredPostRollupEngine {
  return new TieredPostRollupEngine(
    [
      new PercentTieredPostRollupAdjuster(9.2),
      new TieredPostRollupWeightOffsetAdjuster(0.09),
      new RoundingTieredPostRollupAdjuster(0.25),
      new MinimumTieredPostRollupAdjuster(23.2),
      new TieredTieredPostRollupAdjuster([8915, 8967], [1.07, 1]),
    ],
    [],
    2.5,
    53490.8,
  );
}
