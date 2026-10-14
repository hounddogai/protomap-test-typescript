import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

/** One step of the regional exit rule baseline calculation. */
export interface RegionalExitRuleBaselineModifier {
  describe(): string;
  adjust(item: RegionalExitRuleBaseline, value: number): number;
}

export class NameRegionalExitRuleBaselineAdjuster implements RegionalExitRuleBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RegionalExitRuleBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalExitRuleBaselineAdjuster implements RegionalExitRuleBaselineModifier {
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

  adjust(item: RegionalExitRuleBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalExitRuleBaselineAdjuster implements RegionalExitRuleBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalExitRuleBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalExitRuleBaselineAdjuster implements RegionalExitRuleBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalExitRuleBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionalExitRuleBaselineBatchSizeOffsetAdjuster implements RegionalExitRuleBaselineModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: RegionalExitRuleBaseline, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the regional exit rule baseline steps in order and keeps a trace of each. */
export class RegionalExitRuleBaselineEngine {
  steps: RegionalExitRuleBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalExitRuleBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalExitRuleBaseline): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RegionalExitRuleBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalExitRuleBaselineEngine(flagsValue: flags.Registry): RegionalExitRuleBaselineEngine {
  return new RegionalExitRuleBaselineEngine(
    [
      new NameRegionalExitRuleBaselineAdjuster(new Map<string, number>([["south", 1.03], ["retail", 1.03]])),
      new FlaggedRegionalExitRuleBaselineAdjuster(flagsValue, "regional-exit-rule-baseline-regional", -5.1),
      new TieredRegionalExitRuleBaselineAdjuster([4676, 7518], [0.93, 1.17]),
      new MinimumRegionalExitRuleBaselineAdjuster(2.2),
      new RegionalExitRuleBaselineBatchSizeOffsetAdjuster(0.37),
    ],
    [],
    4.2,
    64686.5,
  );
}
