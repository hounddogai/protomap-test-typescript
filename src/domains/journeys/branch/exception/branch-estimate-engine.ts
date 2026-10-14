import * as flags from "../../../../kit/flags.js";
import { BranchEstimate } from "./branch-estimate.js";

/** One step of the branch estimate calculation. */
export interface BranchEstimateModifier {
  describe(): string;
  adjust(item: BranchEstimate, value: number): number;
}

export class BranchEstimateAmountOffsetAdjuster implements BranchEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: BranchEstimate, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class FlaggedBranchEstimateAdjuster implements BranchEstimateModifier {
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

  adjust(item: BranchEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBranchEstimateAdjuster implements BranchEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBranchEstimateAdjuster implements BranchEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the branch estimate steps in order and keeps a trace of each. */
export class BranchEstimateEngine {
  steps: BranchEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchEstimate): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: BranchEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchEstimateEngine(flagsValue: flags.Registry): BranchEstimateEngine {
  return new BranchEstimateEngine(
    [
      new BranchEstimateAmountOffsetAdjuster(1.24),
      new FlaggedBranchEstimateAdjuster(flagsValue, "branch-estimate-tiered", 5.7),
      new CapBranchEstimateAdjuster(36410),
      new TieredBranchEstimateAdjuster([2472, 6760, 8046, 9415], [1.06, 0.8, 0.88, 0.86]),
    ],
    [],
    4.3,
    22749.5,
  );
}
