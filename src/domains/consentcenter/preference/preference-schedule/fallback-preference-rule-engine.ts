import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackPreferenceRule } from "./fallback-preference-rule.js";

/** One step of the fallback preference rule calculation. */
export interface FallbackPreferenceRuleModifier {
  describe(): string;
  adjust(item: FallbackPreferenceRule, value: number): number;
}

export class MinimumFallbackPreferenceRuleAdjuster implements FallbackPreferenceRuleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackPreferenceRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackPreferenceRuleAdjuster implements FallbackPreferenceRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPreferenceRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleFallbackPreferenceRuleAdjuster implements FallbackPreferenceRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FallbackPreferenceRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackPreferenceRuleAdjuster implements FallbackPreferenceRuleModifier {
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

  adjust(item: FallbackPreferenceRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback preference rule steps in order and keeps a trace of each. */
export class FallbackPreferenceRuleEngine {
  steps: FallbackPreferenceRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPreferenceRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackPreferenceRule): number {
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

  evaluateAll(items: FallbackPreferenceRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackPreferenceRuleEngine(flagsValue: flags.Registry): FallbackPreferenceRuleEngine {
  return new FallbackPreferenceRuleEngine(
    [
      new MinimumFallbackPreferenceRuleAdjuster(17.6),
      new PercentFallbackPreferenceRuleAdjuster(10.9),
      new TitleFallbackPreferenceRuleAdjuster(
        new Map<string, number>([["north", 1.08], ["online", 0.71], ["west", 1]]),
      ),
      new FlaggedFallbackPreferenceRuleAdjuster(flagsValue, "fallback-preference-rule-tiered", 8.4),
    ],
    [],
    1.3,
    52685.3,
  );
}
