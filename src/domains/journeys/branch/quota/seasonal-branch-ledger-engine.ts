import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalBranchLedger } from "./seasonal-branch-ledger.js";

/** One step of the seasonal branch ledger calculation. */
export interface SeasonalBranchLedgerModifier {
  describe(): string;
  adjust(item: SeasonalBranchLedger, value: number): number;
}

export class SeasonalBranchLedgerMarginOffsetAdjuster implements SeasonalBranchLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: SeasonalBranchLedger, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedSeasonalBranchLedgerAdjuster implements SeasonalBranchLedgerModifier {
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

  adjust(item: SeasonalBranchLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategorySeasonalBranchLedgerAdjuster implements SeasonalBranchLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: SeasonalBranchLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalBranchLedgerAdjuster implements SeasonalBranchLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalBranchLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSeasonalBranchLedgerAdjuster implements SeasonalBranchLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalBranchLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalBranchLedgerAdjuster implements SeasonalBranchLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalBranchLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal branch ledger steps in order and keeps a trace of each. */
export class SeasonalBranchLedgerEngine {
  steps: SeasonalBranchLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalBranchLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalBranchLedger): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SeasonalBranchLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalBranchLedgerEngine(flagsValue: flags.Registry): SeasonalBranchLedgerEngine {
  return new SeasonalBranchLedgerEngine(
    [
      new SeasonalBranchLedgerMarginOffsetAdjuster(1.09),
      new FlaggedSeasonalBranchLedgerAdjuster(flagsValue, "seasonal-branch-ledger-primary", 6.5),
      new CategorySeasonalBranchLedgerAdjuster(new Map<string, number>([["retail", 1.26]])),
      new TieredSeasonalBranchLedgerAdjuster([2448, 2754, 7101, 9726], [1.19, 1.15, 1.19, 1.16]),
      new PercentSeasonalBranchLedgerAdjuster(-24.3),
      new MinimumSeasonalBranchLedgerAdjuster(0.9),
    ],
    [],
    3,
    42877.8,
  );
}
