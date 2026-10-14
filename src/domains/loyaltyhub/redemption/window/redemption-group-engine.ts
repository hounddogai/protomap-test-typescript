import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionGroup } from "./redemption-group.js";

/** One step of the redemption group calculation. */
export interface RedemptionGroupStep {
  describe(): string;
  adjust(item: RedemptionGroup, value: number): number;
}

export class MinimumRedemptionGroupAdjuster implements RedemptionGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRedemptionGroupAdjuster implements RedemptionGroupStep {
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

  adjust(item: RedemptionGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRedemptionGroupAdjuster implements RedemptionGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRedemptionGroupAdjuster implements RedemptionGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the redemption group steps in order and keeps a trace of each. */
export class RedemptionGroupEngine {
  steps: RedemptionGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RedemptionGroup): number {
    let current = item.netTotal();
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

  evaluateAll(items: RedemptionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRedemptionGroupEngine(flagsValue: flags.Registry): RedemptionGroupEngine {
  return new RedemptionGroupEngine(
    [
      new MinimumRedemptionGroupAdjuster(22.4),
      new FlaggedRedemptionGroupAdjuster(flagsValue, "redemption-group-primary", -6.5),
      new PercentRedemptionGroupAdjuster(16.5),
      new CapRedemptionGroupAdjuster(46578),
    ],
    [],
    2.6,
    36566.8,
  );
}
