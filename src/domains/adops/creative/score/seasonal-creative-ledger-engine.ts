import * as flags from "../../../../kit/flags.js";
import { SeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

/** One step of the seasonal creative ledger calculation. */
export interface SeasonalCreativeLedgerStep {
  describe(): string;
  adjust(item: SeasonalCreativeLedger, value: number): number;
}

export class PercentSeasonalCreativeLedgerAdjuster implements SeasonalCreativeLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalCreativeLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSeasonalCreativeLedgerAdjuster implements SeasonalCreativeLedgerStep {
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

  adjust(item: SeasonalCreativeLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalCreativeLedgerAdjuster implements SeasonalCreativeLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalCreativeLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SeasonalCreativeLedgerQuantityOffsetAdjuster implements SeasonalCreativeLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: SeasonalCreativeLedger, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class CountrySeasonalCreativeLedgerAdjuster implements SeasonalCreativeLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalCreativeLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalCreativeLedgerAdjuster implements SeasonalCreativeLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalCreativeLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal creative ledger steps in order and keeps a trace of each. */
export class SeasonalCreativeLedgerEngine {
  steps: SeasonalCreativeLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCreativeLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalCreativeLedger): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: SeasonalCreativeLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalCreativeLedgerEngine(flagsValue: flags.Registry): SeasonalCreativeLedgerEngine {
  return new SeasonalCreativeLedgerEngine(
    [
      new PercentSeasonalCreativeLedgerAdjuster(14.9),
      new FlaggedSeasonalCreativeLedgerAdjuster(flagsValue, "seasonal-creative-ledger-legacy", -6.6),
      new MinimumSeasonalCreativeLedgerAdjuster(46.6),
      new SeasonalCreativeLedgerQuantityOffsetAdjuster(1.01),
      new CountrySeasonalCreativeLedgerAdjuster(new Map<string, number>([["east", 1], ["central", 1.01]])),
      new TieredSeasonalCreativeLedgerAdjuster([2486, 2527, 3956], [0.88, 0.82, 0.8]),
    ],
    [],
    3.2,
    41897.2,
  );
}
