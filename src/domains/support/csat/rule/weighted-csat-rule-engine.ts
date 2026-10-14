import * as flags from "../../../../kit/flags.js";
import { WeightedCsatRule } from "./weighted-csat-rule.js";

/** One step of the weighted csat rule calculation. */
export interface WeightedCsatRuleAdjuster {
  describe(): string;
  adjust(item: WeightedCsatRule, value: number): number;
}

export class WeightedCsatRuleImpressionsOffsetAdjuster implements WeightedCsatRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: WeightedCsatRule, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class FlaggedWeightedCsatRuleAdjuster implements WeightedCsatRuleAdjuster {
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

  adjust(item: WeightedCsatRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedCsatRuleAdjuster implements WeightedCsatRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedCsatRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted csat rule steps in order and keeps a trace of each. */
export class WeightedCsatRuleEngine {
  steps: WeightedCsatRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedCsatRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedCsatRule): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: WeightedCsatRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedCsatRuleEngine(flagsValue: flags.Registry): WeightedCsatRuleEngine {
  return new WeightedCsatRuleEngine(
    [
      new WeightedCsatRuleImpressionsOffsetAdjuster(1.2),
      new FlaggedWeightedCsatRuleAdjuster(flagsValue, "weighted-csat-rule-adaptive", 0),
      new MinimumWeightedCsatRuleAdjuster(39.5),
    ],
    [],
    4,
    12798,
  );
}
