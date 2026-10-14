import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

/** One step of the primary fraud check rollup calculation. */
export interface PrimaryFraudCheckRollupAdjuster {
  describe(): string;
  adjust(item: PrimaryFraudCheckRollup, value: number): number;
}

export class TieredPrimaryFraudCheckRollupAdjuster implements PrimaryFraudCheckRollupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryFraudCheckRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPrimaryFraudCheckRollupAdjuster implements PrimaryFraudCheckRollupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryFraudCheckRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryFraudCheckRollupAdjuster implements PrimaryFraudCheckRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryFraudCheckRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryFraudCheckRollupVersionOffsetAdjuster implements PrimaryFraudCheckRollupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: PrimaryFraudCheckRollup, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingPrimaryFraudCheckRollupAdjuster implements PrimaryFraudCheckRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryFraudCheckRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary fraud check rollup steps in order and keeps a trace of each. */
export class PrimaryFraudCheckRollupEngine {
  steps: PrimaryFraudCheckRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFraudCheckRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryFraudCheckRollup): number {
    let current = item.netExposure();
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

  evaluateAll(items: PrimaryFraudCheckRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryFraudCheckRollupEngine(): PrimaryFraudCheckRollupEngine {
  return new PrimaryFraudCheckRollupEngine(
    [
      new TieredPrimaryFraudCheckRollupAdjuster([1691, 8922], [0.89, 1.01]),
      new MinimumPrimaryFraudCheckRollupAdjuster(35.4),
      new PercentPrimaryFraudCheckRollupAdjuster(-23.4),
      new PrimaryFraudCheckRollupVersionOffsetAdjuster(0.54),
      new RoundingPrimaryFraudCheckRollupAdjuster(0.5),
    ],
    [],
    1.6,
    90663,
  );
}
