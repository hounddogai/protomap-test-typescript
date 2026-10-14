import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveExitRuleProfile } from "./adaptive-exit-rule-profile.js";

/** One step of the adaptive exit rule profile calculation. */
export interface AdaptiveExitRuleProfileModifier {
  describe(): string;
  adjust(item: AdaptiveExitRuleProfile, value: number): number;
}

export class MinimumAdaptiveExitRuleProfileAdjuster implements AdaptiveExitRuleProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveExitRuleProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredAdaptiveExitRuleProfileAdjuster implements AdaptiveExitRuleProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveExitRuleProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelAdaptiveExitRuleProfileAdjuster implements AdaptiveExitRuleProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptiveExitRuleProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveExitRuleProfileAdjuster implements AdaptiveExitRuleProfileModifier {
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

  adjust(item: AdaptiveExitRuleProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive exit rule profile steps in order and keeps a trace of each. */
export class AdaptiveExitRuleProfileEngine {
  steps: AdaptiveExitRuleProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveExitRuleProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveExitRuleProfile): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: AdaptiveExitRuleProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveExitRuleProfileEngine(flagsValue: flags.Registry): AdaptiveExitRuleProfileEngine {
  return new AdaptiveExitRuleProfileEngine(
    [
      new MinimumAdaptiveExitRuleProfileAdjuster(2.9),
      new TieredAdaptiveExitRuleProfileAdjuster([684, 740, 9754], [0.81, 1.05, 0.99]),
      new LabelAdaptiveExitRuleProfileAdjuster(new Map<string, number>([["central", 0.89]])),
      new FlaggedAdaptiveExitRuleProfileAdjuster(flagsValue, "adaptive-exit-rule-profile-weighted", 9.2),
    ],
    [],
    4.4,
    78471,
  );
}
