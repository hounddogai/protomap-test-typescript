import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BranchBaseline } from "./branch-baseline.js";

/** One step of the branch baseline calculation. */
export interface BranchBaselineModifier {
  describe(): string;
  adjust(item: BranchBaseline, value: number): number;
}

export class CapBranchBaselineAdjuster implements BranchBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBranchBaselineAdjuster implements BranchBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBranchBaselineAdjuster implements BranchBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleBranchBaselineAdjuster implements BranchBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BranchBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBranchBaselineAdjuster implements BranchBaselineModifier {
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

  adjust(item: BranchBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBranchBaselineAdjuster implements BranchBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the branch baseline steps in order and keeps a trace of each. */
export class BranchBaselineEngine {
  steps: BranchBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchBaseline): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: BranchBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchBaselineEngine(flagsValue: flags.Registry): BranchBaselineEngine {
  return new BranchBaselineEngine(
    [
      new CapBranchBaselineAdjuster(26460),
      new RoundingBranchBaselineAdjuster(0.25),
      new MinimumBranchBaselineAdjuster(14.2),
      new TitleBranchBaselineAdjuster(new Map<string, number>([["retail", 0.74]])),
      new FlaggedBranchBaselineAdjuster(flagsValue, "branch-baseline-rolling", -6.9),
      new TieredBranchBaselineAdjuster([3085, 8740], [1.02, 0.93]),
    ],
    [],
    4.1,
    39416.3,
  );
}
