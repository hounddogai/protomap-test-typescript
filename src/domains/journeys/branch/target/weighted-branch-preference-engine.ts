import * as flags from "../../../../kit/flags.js";
import { WeightedBranchPreference } from "./weighted-branch-preference.js";

/** One step of the weighted branch preference calculation. */
export interface WeightedBranchPreferenceModifier {
  describe(): string;
  adjust(item: WeightedBranchPreference, value: number): number;
}

export class FlaggedWeightedBranchPreferenceAdjuster implements WeightedBranchPreferenceModifier {
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

  adjust(item: WeightedBranchPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedBranchPreferenceAdjuster implements WeightedBranchPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedBranchPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelWeightedBranchPreferenceAdjuster implements WeightedBranchPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedBranchPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted branch preference steps in order and keeps a trace of each. */
export class WeightedBranchPreferenceEngine {
  steps: WeightedBranchPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedBranchPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedBranchPreference): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: WeightedBranchPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedBranchPreferenceEngine(flagsValue: flags.Registry): WeightedBranchPreferenceEngine {
  return new WeightedBranchPreferenceEngine(
    [
      new FlaggedWeightedBranchPreferenceAdjuster(flagsValue, "weighted-branch-preference-default", 6.4),
      new CapWeightedBranchPreferenceAdjuster(8795),
      new ChannelWeightedBranchPreferenceAdjuster(new Map<string, number>([["south", 1.26], ["retail", 0.79]])),
    ],
    [],
    0.5,
    30983.2,
  );
}
