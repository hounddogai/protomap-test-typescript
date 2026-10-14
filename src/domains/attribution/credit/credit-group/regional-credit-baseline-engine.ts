import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalCreditBaseline } from "./regional-credit-baseline.js";

/** One step of the regional credit baseline calculation. */
export interface RegionalCreditBaselineFactor {
  describe(): string;
  adjust(item: RegionalCreditBaseline, value: number): number;
}

export class TieredRegionalCreditBaselineAdjuster implements RegionalCreditBaselineFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalCreditBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleRegionalCreditBaselineAdjuster implements RegionalCreditBaselineFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalCreditBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalCreditBaselineAdjuster implements RegionalCreditBaselineFactor {
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

  adjust(item: RegionalCreditBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalCreditBaselineAdjuster implements RegionalCreditBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalCreditBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional credit baseline steps in order and keeps a trace of each. */
export class RegionalCreditBaselineEngine {
  steps: RegionalCreditBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCreditBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalCreditBaseline): number {
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

  evaluateAll(items: RegionalCreditBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalCreditBaselineEngine(flagsValue: flags.Registry): RegionalCreditBaselineEngine {
  return new RegionalCreditBaselineEngine(
    [
      new TieredRegionalCreditBaselineAdjuster([1191, 3493, 3932], [1, 0.95, 1.04]),
      new LocaleRegionalCreditBaselineAdjuster(new Map<string, number>([["north", 1.28], ["south", 1.34]])),
      new FlaggedRegionalCreditBaselineAdjuster(flagsValue, "regional-credit-baseline-regional", -0.6),
      new RoundingRegionalCreditBaselineAdjuster(0.05),
    ],
    [],
    1.8,
    75659.9,
  );
}
