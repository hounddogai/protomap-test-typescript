import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

/** One step of the legacy reward rule variance calculation. */
export interface LegacyRewardRuleVarianceFactor {
  describe(): string;
  adjust(item: LegacyRewardRuleVariance, value: number): number;
}

export class RoundingLegacyRewardRuleVarianceAdjuster implements LegacyRewardRuleVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyRewardRuleVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyRewardRuleVarianceAdjuster implements LegacyRewardRuleVarianceFactor {
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

  adjust(item: LegacyRewardRuleVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyRewardRuleVarianceAdjuster implements LegacyRewardRuleVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyRewardRuleVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryLegacyRewardRuleVarianceAdjuster implements LegacyRewardRuleVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: LegacyRewardRuleVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy reward rule variance steps in order and keeps a trace of each. */
export class LegacyRewardRuleVarianceEngine {
  steps: LegacyRewardRuleVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyRewardRuleVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyRewardRuleVariance): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacyRewardRuleVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyRewardRuleVarianceEngine(flagsValue: flags.Registry): LegacyRewardRuleVarianceEngine {
  return new LegacyRewardRuleVarianceEngine(
    [
      new RoundingLegacyRewardRuleVarianceAdjuster(0.1),
      new FlaggedLegacyRewardRuleVarianceAdjuster(flagsValue, "legacy-reward-rule-variance-fallback", -8.5),
      new CapLegacyRewardRuleVarianceAdjuster(9354),
      new CategoryLegacyRewardRuleVarianceAdjuster(new Map<string, number>([["north", 0.87]])),
    ],
    [],
    3.5,
    48542,
  );
}
