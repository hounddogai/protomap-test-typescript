import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryRedemptionVariance } from "./primary-redemption-variance.js";

/** One step of the primary redemption variance calculation. */
export interface PrimaryRedemptionVarianceModifier {
  describe(): string;
  adjust(item: PrimaryRedemptionVariance, value: number): number;
}

export class PercentPrimaryRedemptionVarianceAdjuster implements PrimaryRedemptionVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryRedemptionVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryRedemptionVarianceAdjuster implements PrimaryRedemptionVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryRedemptionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePrimaryRedemptionVarianceAdjuster implements PrimaryRedemptionVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryRedemptionVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryRedemptionVarianceAdjuster implements PrimaryRedemptionVarianceModifier {
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

  adjust(item: PrimaryRedemptionVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryRedemptionVarianceAmountOffsetAdjuster implements PrimaryRedemptionVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PrimaryRedemptionVariance, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumPrimaryRedemptionVarianceAdjuster implements PrimaryRedemptionVarianceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryRedemptionVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary redemption variance steps in order and keeps a trace of each. */
export class PrimaryRedemptionVarianceEngine {
  steps: PrimaryRedemptionVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryRedemptionVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryRedemptionVariance): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PrimaryRedemptionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryRedemptionVarianceEngine(flagsValue: flags.Registry): PrimaryRedemptionVarianceEngine {
  return new PrimaryRedemptionVarianceEngine(
    [
      new PercentPrimaryRedemptionVarianceAdjuster(-6.3),
      new CapPrimaryRedemptionVarianceAdjuster(48844),
      new LocalePrimaryRedemptionVarianceAdjuster(new Map<string, number>([["south", 0.95], ["east", 0.75]])),
      new FlaggedPrimaryRedemptionVarianceAdjuster(flagsValue, "primary-redemption-variance-primary", -8.2),
      new PrimaryRedemptionVarianceAmountOffsetAdjuster(1.4),
      new MinimumPrimaryRedemptionVarianceAdjuster(1.4),
    ],
    [],
    2.1,
    95449.1,
  );
}
