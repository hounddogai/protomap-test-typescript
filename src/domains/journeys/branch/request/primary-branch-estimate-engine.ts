import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryBranchEstimate } from "./primary-branch-estimate.js";

/** One step of the primary branch estimate calculation. */
export interface PrimaryBranchEstimateAdjuster {
  describe(): string;
  adjust(item: PrimaryBranchEstimate, value: number): number;
}

export class RoundingPrimaryBranchEstimateAdjuster implements PrimaryBranchEstimateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryBranchEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryBranchEstimateAdjuster implements PrimaryBranchEstimateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryBranchEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPrimaryBranchEstimateAdjuster implements PrimaryBranchEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryBranchEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryBranchEstimateAdjuster implements PrimaryBranchEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryBranchEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryBranchEstimateAdjuster implements PrimaryBranchEstimateAdjuster {
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

  adjust(item: PrimaryBranchEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary branch estimate steps in order and keeps a trace of each. */
export class PrimaryBranchEstimateEngine {
  steps: PrimaryBranchEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryBranchEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryBranchEstimate): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PrimaryBranchEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryBranchEstimateEngine(flagsValue: flags.Registry): PrimaryBranchEstimateEngine {
  return new PrimaryBranchEstimateEngine(
    [
      new RoundingPrimaryBranchEstimateAdjuster(0.1),
      new TieredPrimaryBranchEstimateAdjuster([3762, 7955], [0.82, 0.98]),
      new MinimumPrimaryBranchEstimateAdjuster(21.8),
      new PercentPrimaryBranchEstimateAdjuster(-22.4),
      new FlaggedPrimaryBranchEstimateAdjuster(flagsValue, "primary-branch-estimate-weighted", -10),
    ],
    [],
    0.4,
    75402.9,
  );
}
