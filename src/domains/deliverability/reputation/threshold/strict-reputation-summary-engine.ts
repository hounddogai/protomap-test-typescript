import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictReputationSummary } from "./strict-reputation-summary.js";

/** One step of the strict reputation summary calculation. */
export interface StrictReputationSummaryStep {
  describe(): string;
  adjust(item: StrictReputationSummary, value: number): number;
}

export class TieredStrictReputationSummaryAdjuster implements StrictReputationSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictReputationSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictReputationSummaryAdjuster implements StrictReputationSummaryStep {
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

  adjust(item: StrictReputationSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStrictReputationSummaryAdjuster implements StrictReputationSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictReputationSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleStrictReputationSummaryAdjuster implements StrictReputationSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StrictReputationSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictReputationSummaryRatioOffsetAdjuster implements StrictReputationSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: StrictReputationSummary, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapStrictReputationSummaryAdjuster implements StrictReputationSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictReputationSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict reputation summary steps in order and keeps a trace of each. */
export class StrictReputationSummaryEngine {
  steps: StrictReputationSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictReputationSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictReputationSummary): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: StrictReputationSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictReputationSummaryEngine(flagsValue: flags.Registry): StrictReputationSummaryEngine {
  return new StrictReputationSummaryEngine(
    [
      new TieredStrictReputationSummaryAdjuster([3928, 4130, 4405, 6004], [0.89, 1.18, 1.1, 1.14]),
      new FlaggedStrictReputationSummaryAdjuster(flagsValue, "strict-reputation-summary-pending", -5.3),
      new PercentStrictReputationSummaryAdjuster(21.1),
      new TitleStrictReputationSummaryAdjuster(new Map<string, number>([["central", 0.86], ["south", 1.26]])),
      new StrictReputationSummaryRatioOffsetAdjuster(0.46),
      new CapStrictReputationSummaryAdjuster(30914),
    ],
    [],
    4.5,
    23265.1,
  );
}
