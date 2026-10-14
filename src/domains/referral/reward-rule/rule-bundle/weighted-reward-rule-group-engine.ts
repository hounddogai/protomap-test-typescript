import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedRewardRuleGroup } from "./weighted-reward-rule-group.js";

/** One step of the weighted reward rule group calculation. */
export interface WeightedRewardRuleGroupStep {
  describe(): string;
  adjust(item: WeightedRewardRuleGroup, value: number): number;
}

export class WeightedRewardRuleGroupStartsAtOffsetAdjuster implements WeightedRewardRuleGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: WeightedRewardRuleGroup, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class MinimumWeightedRewardRuleGroupAdjuster implements WeightedRewardRuleGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRewardRuleGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedRewardRuleGroupAdjuster implements WeightedRewardRuleGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRewardRuleGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedRewardRuleGroupAdjuster implements WeightedRewardRuleGroupStep {
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

  adjust(item: WeightedRewardRuleGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelWeightedRewardRuleGroupAdjuster implements WeightedRewardRuleGroupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedRewardRuleGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted reward rule group steps in order and keeps a trace of each. */
export class WeightedRewardRuleGroupEngine {
  steps: WeightedRewardRuleGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRewardRuleGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedRewardRuleGroup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: WeightedRewardRuleGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedRewardRuleGroupEngine(flagsValue: flags.Registry): WeightedRewardRuleGroupEngine {
  return new WeightedRewardRuleGroupEngine(
    [
      new WeightedRewardRuleGroupStartsAtOffsetAdjuster(1.03),
      new MinimumWeightedRewardRuleGroupAdjuster(10.4),
      new RoundingWeightedRewardRuleGroupAdjuster(0.5),
      new FlaggedWeightedRewardRuleGroupAdjuster(flagsValue, "weighted-reward-rule-group-manual", 5.8),
      new LabelWeightedRewardRuleGroupAdjuster(new Map<string, number>([["south", 0.97]])),
    ],
    [],
    0.2,
    79702.7,
  );
}
