import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BranchEntry } from "./branch-entry.js";

/** One step of the branch entry calculation. */
export interface BranchEntryFactor {
  describe(): string;
  adjust(item: BranchEntry, value: number): number;
}

export class RoundingBranchEntryAdjuster implements BranchEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelBranchEntryAdjuster implements BranchEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BranchEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBranchEntryAdjuster implements BranchEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBranchEntryAdjuster implements BranchEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBranchEntryAdjuster implements BranchEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBranchEntryAdjuster implements BranchEntryFactor {
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

  adjust(item: BranchEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch entry steps in order and keeps a trace of each. */
export class BranchEntryEngine {
  steps: BranchEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BranchEntry): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: BranchEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBranchEntryEngine(flagsValue: flags.Registry): BranchEntryEngine {
  return new BranchEntryEngine(
    [
      new RoundingBranchEntryAdjuster(0.1),
      new ChannelBranchEntryAdjuster(new Map<string, number>([["north", 0.75], ["west", 0.85]])),
      new MinimumBranchEntryAdjuster(35.9),
      new TieredBranchEntryAdjuster([3155, 8818, 9682], [0.83, 1.08, 1.17]),
      new PercentBranchEntryAdjuster(4.3),
      new FlaggedBranchEntryAdjuster(flagsValue, "branch-entry-batched", -3.7),
    ],
    [],
    2.9,
    91824.3,
  );
}
