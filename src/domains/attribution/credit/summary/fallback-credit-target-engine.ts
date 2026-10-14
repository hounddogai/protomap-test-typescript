import * as flags from "../../../../kit/flags.js";
import { FallbackCreditTarget } from "./fallback-credit-target.js";

/** One step of the fallback credit target calculation. */
export interface FallbackCreditTargetModifier {
  describe(): string;
  adjust(item: FallbackCreditTarget, value: number): number;
}

export class PercentFallbackCreditTargetAdjuster implements FallbackCreditTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackCreditTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackCreditTargetAdjuster implements FallbackCreditTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackCreditTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackCreditTargetAdjuster implements FallbackCreditTargetModifier {
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

  adjust(item: FallbackCreditTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackCreditTargetAdjuster implements FallbackCreditTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackCreditTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameFallbackCreditTargetAdjuster implements FallbackCreditTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackCreditTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackCreditTargetWindowDaysOffsetAdjuster implements FallbackCreditTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: FallbackCreditTarget, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the fallback credit target steps in order and keeps a trace of each. */
export class FallbackCreditTargetEngine {
  steps: FallbackCreditTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCreditTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackCreditTarget): number {
    let current = item.netTotal();
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

  evaluateAll(items: FallbackCreditTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackCreditTargetEngine(flagsValue: flags.Registry): FallbackCreditTargetEngine {
  return new FallbackCreditTargetEngine(
    [
      new PercentFallbackCreditTargetAdjuster(19.3),
      new TieredFallbackCreditTargetAdjuster([1039, 1276, 3712, 8164], [1.1, 1.01, 1.17, 0.85]),
      new FlaggedFallbackCreditTargetAdjuster(flagsValue, "fallback-credit-target-seasonal", -1.1),
      new MinimumFallbackCreditTargetAdjuster(43.4),
      new NameFallbackCreditTargetAdjuster(new Map<string, number>([["south", 1.21], ["west", 0.74]])),
      new FallbackCreditTargetWindowDaysOffsetAdjuster(0.99),
    ],
    [],
    4.7,
    26815.6,
  );
}
