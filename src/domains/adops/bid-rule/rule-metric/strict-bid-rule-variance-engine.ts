import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictBidRuleVariance } from "./strict-bid-rule-variance.js";

/** One step of the strict bid rule variance calculation. */
export interface StrictBidRuleVarianceStep {
  describe(): string;
  adjust(item: StrictBidRuleVariance, value: number): number;
}

export class UnitStrictBidRuleVarianceAdjuster implements StrictBidRuleVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: StrictBidRuleVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingStrictBidRuleVarianceAdjuster implements StrictBidRuleVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictBidRuleVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictBidRuleVarianceAdjuster implements StrictBidRuleVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictBidRuleVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentStrictBidRuleVarianceAdjuster implements StrictBidRuleVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictBidRuleVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StrictBidRuleVarianceMarginOffsetAdjuster implements StrictBidRuleVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: StrictBidRuleVariance, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedStrictBidRuleVarianceAdjuster implements StrictBidRuleVarianceStep {
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

  adjust(item: StrictBidRuleVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict bid rule variance steps in order and keeps a trace of each. */
export class StrictBidRuleVarianceEngine {
  steps: StrictBidRuleVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBidRuleVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictBidRuleVariance): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: StrictBidRuleVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictBidRuleVarianceEngine(flagsValue: flags.Registry): StrictBidRuleVarianceEngine {
  return new StrictBidRuleVarianceEngine(
    [
      new UnitStrictBidRuleVarianceAdjuster(new Map<string, number>([["east", 1.28]])),
      new RoundingStrictBidRuleVarianceAdjuster(5),
      new MinimumStrictBidRuleVarianceAdjuster(8.7),
      new PercentStrictBidRuleVarianceAdjuster(-15.6),
      new StrictBidRuleVarianceMarginOffsetAdjuster(1.19),
      new FlaggedStrictBidRuleVarianceAdjuster(flagsValue, "strict-bid-rule-variance-fallback", -1.3),
    ],
    [],
    1.3,
    54375.3,
  );
}
