import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditOverride } from "./credit-override.js";

/** One step of the credit override calculation. */
export interface CreditOverrideStep {
  describe(): string;
  adjust(item: CreditOverride, value: number): number;
}

export class MinimumCreditOverrideAdjuster implements CreditOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCreditOverrideAdjuster implements CreditOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CreditOverrideMinimumOffsetAdjuster implements CreditOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: CreditOverride, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class TieredCreditOverrideAdjuster implements CreditOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCreditOverrideAdjuster implements CreditOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCreditOverrideAdjuster implements CreditOverrideStep {
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

  adjust(item: CreditOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit override steps in order and keeps a trace of each. */
export class CreditOverrideEngine {
  steps: CreditOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditOverride): number {
    let current = item.netTotal();
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

  evaluateAll(items: CreditOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditOverrideEngine(flagsValue: flags.Registry): CreditOverrideEngine {
  return new CreditOverrideEngine(
    [
      new MinimumCreditOverrideAdjuster(15),
      new RoundingCreditOverrideAdjuster(0.1),
      new CreditOverrideMinimumOffsetAdjuster(1.35),
      new TieredCreditOverrideAdjuster([1580, 3125, 9110], [0.83, 1.13, 1]),
      new PercentCreditOverrideAdjuster(25),
      new FlaggedCreditOverrideAdjuster(flagsValue, "credit-override-batched", 2.8),
    ],
    [],
    2,
    18021.3,
  );
}
