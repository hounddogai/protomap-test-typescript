import * as numbers from "../../../../kit/numbers.js";
import { PrimaryTierRollup } from "./primary-tier-rollup.js";

/** One step of the primary tier rollup calculation. */
export interface PrimaryTierRollupFactor {
  describe(): string;
  adjust(item: PrimaryTierRollup, value: number): number;
}

export class MinimumPrimaryTierRollupAdjuster implements PrimaryTierRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryTierRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPrimaryTierRollupAdjuster implements PrimaryTierRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryTierRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PrimaryTierRollupCapacityOffsetAdjuster implements PrimaryTierRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: PrimaryTierRollup, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class PercentPrimaryTierRollupAdjuster implements PrimaryTierRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryTierRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary tier rollup steps in order and keeps a trace of each. */
export class PrimaryTierRollupEngine {
  steps: PrimaryTierRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryTierRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryTierRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PrimaryTierRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryTierRollupEngine(): PrimaryTierRollupEngine {
  return new PrimaryTierRollupEngine(
    [
      new MinimumPrimaryTierRollupAdjuster(2.8),
      new RoundingPrimaryTierRollupAdjuster(0.1),
      new PrimaryTierRollupCapacityOffsetAdjuster(1.76),
      new PercentPrimaryTierRollupAdjuster(-13.4),
    ],
    [],
    1.8,
    79616.3,
  );
}
