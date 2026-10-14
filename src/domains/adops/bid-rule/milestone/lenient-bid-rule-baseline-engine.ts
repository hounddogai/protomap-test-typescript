import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientBidRuleBaseline } from "./lenient-bid-rule-baseline.js";

/** One step of the lenient bid rule baseline calculation. */
export interface LenientBidRuleBaselineStep {
  describe(): string;
  adjust(item: LenientBidRuleBaseline, value: number): number;
}

export class RoundingLenientBidRuleBaselineAdjuster implements LenientBidRuleBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientBidRuleBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleLenientBidRuleBaselineAdjuster implements LenientBidRuleBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientBidRuleBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LenientBidRuleBaselineStartsAtOffsetAdjuster implements LenientBidRuleBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: LenientBidRuleBaseline, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class CapLenientBidRuleBaselineAdjuster implements LenientBidRuleBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientBidRuleBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientBidRuleBaselineAdjuster implements LenientBidRuleBaselineStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientBidRuleBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientBidRuleBaselineAdjuster implements LenientBidRuleBaselineStep {
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

  adjust(item: LenientBidRuleBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient bid rule baseline steps in order and keeps a trace of each. */
export class LenientBidRuleBaselineEngine {
  steps: LenientBidRuleBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientBidRuleBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientBidRuleBaseline): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientBidRuleBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientBidRuleBaselineEngine(flagsValue: flags.Registry): LenientBidRuleBaselineEngine {
  return new LenientBidRuleBaselineEngine(
    [
      new RoundingLenientBidRuleBaselineAdjuster(0.1),
      new TitleLenientBidRuleBaselineAdjuster(new Map<string, number>([["west", 1.22]])),
      new LenientBidRuleBaselineStartsAtOffsetAdjuster(1.81),
      new CapLenientBidRuleBaselineAdjuster(11157),
      new MinimumLenientBidRuleBaselineAdjuster(22.3),
      new FlaggedLenientBidRuleBaselineAdjuster(flagsValue, "lenient-bid-rule-baseline-weighted", 6.7),
    ],
    [],
    4.3,
    67865.8,
  );
}
