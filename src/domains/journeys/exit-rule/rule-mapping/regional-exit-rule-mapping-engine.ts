import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalExitRuleMapping } from "./regional-exit-rule-mapping.js";

/** One step of the regional exit rule mapping calculation. */
export interface RegionalExitRuleMappingModifier {
  describe(): string;
  adjust(item: RegionalExitRuleMapping, value: number): number;
}

export class RoundingRegionalExitRuleMappingAdjuster implements RegionalExitRuleMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalExitRuleMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelRegionalExitRuleMappingAdjuster implements RegionalExitRuleMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalExitRuleMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalExitRuleMappingAdjuster implements RegionalExitRuleMappingModifier {
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

  adjust(item: RegionalExitRuleMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalExitRuleMappingAdjuster implements RegionalExitRuleMappingModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalExitRuleMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalExitRuleMappingAdjuster implements RegionalExitRuleMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalExitRuleMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional exit rule mapping steps in order and keeps a trace of each. */
export class RegionalExitRuleMappingEngine {
  steps: RegionalExitRuleMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalExitRuleMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalExitRuleMapping): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RegionalExitRuleMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalExitRuleMappingEngine(flagsValue: flags.Registry): RegionalExitRuleMappingEngine {
  return new RegionalExitRuleMappingEngine(
    [
      new RoundingRegionalExitRuleMappingAdjuster(1),
      new LabelRegionalExitRuleMappingAdjuster(new Map<string, number>([["west", 1.22], ["south", 0.95]])),
      new FlaggedRegionalExitRuleMappingAdjuster(flagsValue, "regional-exit-rule-mapping-capped", -0.4),
      new PercentRegionalExitRuleMappingAdjuster(18.9),
      new MinimumRegionalExitRuleMappingAdjuster(3.3),
    ],
    [],
    2.8,
    97098.2,
  );
}
