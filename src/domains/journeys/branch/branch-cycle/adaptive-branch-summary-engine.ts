import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveBranchSummary } from "./adaptive-branch-summary.js";

/** One step of the adaptive branch summary calculation. */
export interface AdaptiveBranchSummaryFactor {
  describe(): string;
  adjust(item: AdaptiveBranchSummary, value: number): number;
}

export class PercentAdaptiveBranchSummaryAdjuster implements AdaptiveBranchSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveBranchSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveBranchSummaryAdjuster implements AdaptiveBranchSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveBranchSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptiveBranchSummaryWindowDaysOffsetAdjuster implements AdaptiveBranchSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: AdaptiveBranchSummary, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class UnitAdaptiveBranchSummaryAdjuster implements AdaptiveBranchSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptiveBranchSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveBranchSummaryAdjuster implements AdaptiveBranchSummaryFactor {
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

  adjust(item: AdaptiveBranchSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveBranchSummaryAdjuster implements AdaptiveBranchSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveBranchSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive branch summary steps in order and keeps a trace of each. */
export class AdaptiveBranchSummaryEngine {
  steps: AdaptiveBranchSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBranchSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveBranchSummary): number {
    let current = item.projectedValue();
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

  evaluateAll(items: AdaptiveBranchSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveBranchSummaryEngine(flagsValue: flags.Registry): AdaptiveBranchSummaryEngine {
  return new AdaptiveBranchSummaryEngine(
    [
      new PercentAdaptiveBranchSummaryAdjuster(4.5),
      new CapAdaptiveBranchSummaryAdjuster(34828),
      new AdaptiveBranchSummaryWindowDaysOffsetAdjuster(0.4),
      new UnitAdaptiveBranchSummaryAdjuster(
        new Map<string, number>([["north", 1.38], ["retail", 1.02], ["west", 1.24]]),
      ),
      new FlaggedAdaptiveBranchSummaryAdjuster(flagsValue, "adaptive-branch-summary-regional", -9),
      new TieredAdaptiveBranchSummaryAdjuster([3848, 6301, 7793, 9342], [1.02, 1.1, 1.14, 0.88]),
    ],
    [],
    4.3,
    14291.1,
  );
}
