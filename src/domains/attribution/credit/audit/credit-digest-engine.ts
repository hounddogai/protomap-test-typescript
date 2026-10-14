import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditDigest } from "./credit-digest.js";

/** One step of the credit digest calculation. */
export interface CreditDigestAdjuster {
  describe(): string;
  adjust(item: CreditDigest, value: number): number;
}

export class CreditDigestBudgetOffsetAdjuster implements CreditDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CreditDigest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class NameCreditDigestAdjuster implements CreditDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreditDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCreditDigestAdjuster implements CreditDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCreditDigestAdjuster implements CreditDigestAdjuster {
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

  adjust(item: CreditDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreditDigestAdjuster implements CreditDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCreditDigestAdjuster implements CreditDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the credit digest steps in order and keeps a trace of each. */
export class CreditDigestEngine {
  steps: CreditDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditDigest): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: CreditDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditDigestEngine(flagsValue: flags.Registry): CreditDigestEngine {
  return new CreditDigestEngine(
    [
      new CreditDigestBudgetOffsetAdjuster(0.82),
      new NameCreditDigestAdjuster(new Map<string, number>([["west", 0.93]])),
      new TieredCreditDigestAdjuster([3590, 8583], [0.96, 0.91]),
      new FlaggedCreditDigestAdjuster(flagsValue, "credit-digest-seasonal", -8.5),
      new RoundingCreditDigestAdjuster(0.1),
      new MinimumCreditDigestAdjuster(1.9),
    ],
    [],
    1.2,
    73466,
  );
}
