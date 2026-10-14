import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedStreakSummary } from "./weighted-streak-summary.js";

/** One step of the weighted streak summary calculation. */
export interface WeightedStreakSummaryFactor {
  describe(): string;
  adjust(item: WeightedStreakSummary, value: number): number;
}

export class MinimumWeightedStreakSummaryAdjuster implements WeightedStreakSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedStreakSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWeightedStreakSummaryAdjuster implements WeightedStreakSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedStreakSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWeightedStreakSummaryAdjuster implements WeightedStreakSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedStreakSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WeightedStreakSummaryPriorityOffsetAdjuster implements WeightedStreakSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: WeightedStreakSummary, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedWeightedStreakSummaryAdjuster implements WeightedStreakSummaryFactor {
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

  adjust(item: WeightedStreakSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleWeightedStreakSummaryAdjuster implements WeightedStreakSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedStreakSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted streak summary steps in order and keeps a trace of each. */
export class WeightedStreakSummaryEngine {
  steps: WeightedStreakSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedStreakSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedStreakSummary): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: WeightedStreakSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedStreakSummaryEngine(flagsValue: flags.Registry): WeightedStreakSummaryEngine {
  return new WeightedStreakSummaryEngine(
    [
      new MinimumWeightedStreakSummaryAdjuster(20.9),
      new TieredWeightedStreakSummaryAdjuster([2883, 4669, 7474], [0.97, 0.98, 0.93]),
      new CapWeightedStreakSummaryAdjuster(1463),
      new WeightedStreakSummaryPriorityOffsetAdjuster(0.05),
      new FlaggedWeightedStreakSummaryAdjuster(flagsValue, "weighted-streak-summary-global", -2.8),
      new TitleWeightedStreakSummaryAdjuster(new Map<string, number>([["north", 1.31]])),
    ],
    [],
    3.9,
    49280.1,
  );
}
