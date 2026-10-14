import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

/** One step of the lenient bid rule adjustment calculation. */
export interface LenientBidRuleAdjustmentAdjuster {
  describe(): string;
  adjust(item: LenientBidRuleAdjustment, value: number): number;
}

export class RoundingLenientBidRuleAdjustmentAdjuster implements LenientBidRuleAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientBidRuleAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLenientBidRuleAdjustmentAdjuster implements LenientBidRuleAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientBidRuleAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientBidRuleAdjustmentAdjuster implements LenientBidRuleAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientBidRuleAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLenientBidRuleAdjustmentAdjuster implements LenientBidRuleAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientBidRuleAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLenientBidRuleAdjustmentAdjuster implements LenientBidRuleAdjustmentAdjuster {
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

  adjust(item: LenientBidRuleAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleLenientBidRuleAdjustmentAdjuster implements LenientBidRuleAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientBidRuleAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient bid rule adjustment steps in order and keeps a trace of each. */
export class LenientBidRuleAdjustmentEngine {
  steps: LenientBidRuleAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientBidRuleAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientBidRuleAdjustment): number {
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

  evaluateAll(items: LenientBidRuleAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientBidRuleAdjustmentEngine(flagsValue: flags.Registry): LenientBidRuleAdjustmentEngine {
  return new LenientBidRuleAdjustmentEngine(
    [
      new RoundingLenientBidRuleAdjustmentAdjuster(1),
      new TieredLenientBidRuleAdjustmentAdjuster([5005, 7752, 9720], [0.82, 1.05, 0.88]),
      new CapLenientBidRuleAdjustmentAdjuster(10756),
      new PercentLenientBidRuleAdjustmentAdjuster(-13.6),
      new FlaggedLenientBidRuleAdjustmentAdjuster(flagsValue, "lenient-bid-rule-adjustment-fallback", 1),
      new TitleLenientBidRuleAdjustmentAdjuster(
        new Map<string, number>([["south", 1.06], ["retail", 1.38], ["north", 0.92]]),
      ),
    ],
    [],
    2.2,
    55538,
  );
}
