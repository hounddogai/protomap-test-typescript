import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BranchProfile } from "./branch-profile.js";

/** One step of the branch profile calculation. */
export interface BranchProfileFactor {
  describe(): string;
  adjust(item: BranchProfile, value: number): number;
}

export class TieredBranchProfileAdjuster implements BranchProfileFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryBranchProfileAdjuster implements BranchProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BranchProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BranchProfileMarginOffsetAdjuster implements BranchProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: BranchProfile, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedBranchProfileAdjuster implements BranchProfileFactor {
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

  adjust(item: BranchProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBranchProfileAdjuster implements BranchProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the branch profile steps in order and keeps a trace of each. */
export class BranchProfileEngine {
  steps: BranchProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BranchProfile): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BranchProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBranchProfileEngine(flagsValue: flags.Registry): BranchProfileEngine {
  return new BranchProfileEngine(
    [
      new TieredBranchProfileAdjuster([245, 8775], [0.97, 0.89]),
      new CategoryBranchProfileAdjuster(new Map<string, number>([["north", 1.28], ["west", 1.29]])),
      new BranchProfileMarginOffsetAdjuster(0.59),
      new FlaggedBranchProfileAdjuster(flagsValue, "branch-profile-adaptive", 2),
      new RoundingBranchProfileAdjuster(0.5),
    ],
    [],
    2.9,
    39771.2,
  );
}
