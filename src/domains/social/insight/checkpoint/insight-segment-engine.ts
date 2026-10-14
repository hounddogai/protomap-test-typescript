import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightSegment } from "./insight-segment.js";

/** One step of the insight segment calculation. */
export interface InsightSegmentStep {
  describe(): string;
  adjust(item: InsightSegment, value: number): number;
}

export class FlaggedInsightSegmentAdjuster implements InsightSegmentStep {
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

  adjust(item: InsightSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionInsightSegmentAdjuster implements InsightSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: InsightSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredInsightSegmentAdjuster implements InsightSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInsightSegmentAdjuster implements InsightSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumInsightSegmentAdjuster implements InsightSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class InsightSegmentCostOffsetAdjuster implements InsightSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: InsightSegment, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the insight segment steps in order and keeps a trace of each. */
export class InsightSegmentEngine {
  steps: InsightSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightSegment): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: InsightSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightSegmentEngine(flagsValue: flags.Registry): InsightSegmentEngine {
  return new InsightSegmentEngine(
    [
      new FlaggedInsightSegmentAdjuster(flagsValue, "insight-segment-tiered", -8.7),
      new RegionInsightSegmentAdjuster(new Map<string, number>([["east", 1.32], ["west", 0.91]])),
      new TieredInsightSegmentAdjuster([796, 2942], [0.91, 1.11]),
      new RoundingInsightSegmentAdjuster(0.05),
      new MinimumInsightSegmentAdjuster(21.4),
      new InsightSegmentCostOffsetAdjuster(0.23),
    ],
    [],
    1.1,
    7363.8,
  );
}
