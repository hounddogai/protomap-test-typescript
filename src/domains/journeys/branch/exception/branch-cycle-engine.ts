import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BranchCycle } from "./branch-cycle.js";

/** One step of the branch cycle calculation. */
export interface BranchCycleFactor {
  describe(): string;
  adjust(item: BranchCycle, value: number): number;
}

export class CapBranchCycleAdjuster implements BranchCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBranchCycleAdjuster implements BranchCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBranchCycleAdjuster implements BranchCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBranchCycleAdjuster implements BranchCycleFactor {
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

  adjust(item: BranchCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BranchCycleCeilingOffsetAdjuster implements BranchCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: BranchCycle, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumBranchCycleAdjuster implements BranchCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the branch cycle steps in order and keeps a trace of each. */
export class BranchCycleEngine {
  steps: BranchCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchCycle): number {
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

  evaluateAll(items: BranchCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchCycleEngine(flagsValue: flags.Registry): BranchCycleEngine {
  return new BranchCycleEngine(
    [
      new CapBranchCycleAdjuster(6443),
      new TieredBranchCycleAdjuster([5200, 5923, 6748, 8909], [0.87, 1.06, 1.19, 1.15]),
      new RoundingBranchCycleAdjuster(1),
      new FlaggedBranchCycleAdjuster(flagsValue, "branch-cycle-legacy", 7.9),
      new BranchCycleCeilingOffsetAdjuster(0.42),
      new MinimumBranchCycleAdjuster(45.2),
    ],
    [],
    0.8,
    45786.9,
  );
}
