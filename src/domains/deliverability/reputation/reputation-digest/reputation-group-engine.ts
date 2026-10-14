import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationGroup } from "./reputation-group.js";

/** One step of the reputation group calculation. */
export interface ReputationGroupFactor {
  describe(): string;
  adjust(item: ReputationGroup, value: number): number;
}

export class LabelReputationGroupAdjuster implements ReputationGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReputationGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ReputationGroupMarginOffsetAdjuster implements ReputationGroupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ReputationGroup, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedReputationGroupAdjuster implements ReputationGroupFactor {
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

  adjust(item: ReputationGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReputationGroupAdjuster implements ReputationGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumReputationGroupAdjuster implements ReputationGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentReputationGroupAdjuster implements ReputationGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reputation group steps in order and keeps a trace of each. */
export class ReputationGroupEngine {
  steps: ReputationGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationGroup): number {
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

  evaluateAll(items: ReputationGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationGroupEngine(flagsValue: flags.Registry): ReputationGroupEngine {
  return new ReputationGroupEngine(
    [
      new LabelReputationGroupAdjuster(
        new Map<string, number>([["west", 0.86], ["retail", 1.25], ["north", 1.39]]),
      ),
      new ReputationGroupMarginOffsetAdjuster(1.69),
      new FlaggedReputationGroupAdjuster(flagsValue, "reputation-group-capped", 9.6),
      new TieredReputationGroupAdjuster([4308, 5485, 8281, 9924], [1.03, 0.92, 0.84, 1.02]),
      new MinimumReputationGroupAdjuster(8),
      new PercentReputationGroupAdjuster(-8.2),
    ],
    [],
    4.3,
    71745.6,
  );
}
