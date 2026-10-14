import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackPostRule } from "./fallback-post-rule.js";

/** One step of the fallback post rule calculation. */
export interface FallbackPostRuleAdjuster {
  describe(): string;
  adjust(item: FallbackPostRule, value: number): number;
}

export class PercentFallbackPostRuleAdjuster implements FallbackPostRuleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPostRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelFallbackPostRuleAdjuster implements FallbackPostRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackPostRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackPostRuleAdjuster implements FallbackPostRuleAdjuster {
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

  adjust(item: FallbackPostRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback post rule steps in order and keeps a trace of each. */
export class FallbackPostRuleEngine {
  steps: FallbackPostRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPostRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackPostRule): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FallbackPostRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackPostRuleEngine(flagsValue: flags.Registry): FallbackPostRuleEngine {
  return new FallbackPostRuleEngine(
    [
      new PercentFallbackPostRuleAdjuster(-17.4),
      new LabelFallbackPostRuleAdjuster(
        new Map<string, number>([["north", 0.83], ["retail", 0.79], ["central", 1.27]]),
      ),
      new FlaggedFallbackPostRuleAdjuster(flagsValue, "fallback-post-rule-fallback", -0.7),
    ],
    [],
    1.4,
    44382.8,
  );
}
