import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightTier } from "./insight-tier.js";

/** One step of the insight tier calculation. */
export interface InsightTierModifier {
  describe(): string;
  adjust(item: InsightTier, value: number): number;
}

export class RoundingInsightTierAdjuster implements InsightTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapInsightTierAdjuster implements InsightTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredInsightTierAdjuster implements InsightTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumInsightTierAdjuster implements InsightTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInsightTierAdjuster implements InsightTierModifier {
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

  adjust(item: InsightTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceInsightTierAdjuster implements InsightTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: InsightTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight tier steps in order and keeps a trace of each. */
export class InsightTierEngine {
  steps: InsightTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightTier): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: InsightTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightTierEngine(flagsValue: flags.Registry): InsightTierEngine {
  return new InsightTierEngine(
    [
      new RoundingInsightTierAdjuster(0.1),
      new CapInsightTierAdjuster(37304),
      new TieredInsightTierAdjuster([2181, 5572], [0.83, 0.96]),
      new MinimumInsightTierAdjuster(7.8),
      new FlaggedInsightTierAdjuster(flagsValue, "insight-tier-scheduled", 3.5),
      new UtmSourceInsightTierAdjuster(new Map<string, number>([["south", 0.96]])),
    ],
    [],
    1.2,
    93399.2,
  );
}
