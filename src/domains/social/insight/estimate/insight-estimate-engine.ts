import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightEstimate } from "./insight-estimate.js";

/** One step of the insight estimate calculation. */
export interface InsightEstimateAdjuster {
  describe(): string;
  adjust(item: InsightEstimate, value: number): number;
}

export class TieredInsightEstimateAdjuster implements InsightEstimateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInsightEstimateAdjuster implements InsightEstimateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleInsightEstimateAdjuster implements InsightEstimateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: InsightEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumInsightEstimateAdjuster implements InsightEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInsightEstimateAdjuster implements InsightEstimateAdjuster {
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

  adjust(item: InsightEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapInsightEstimateAdjuster implements InsightEstimateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the insight estimate steps in order and keeps a trace of each. */
export class InsightEstimateEngine {
  steps: InsightEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightEstimate): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: InsightEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightEstimateEngine(flagsValue: flags.Registry): InsightEstimateEngine {
  return new InsightEstimateEngine(
    [
      new TieredInsightEstimateAdjuster([3320, 8931], [1.09, 0.92]),
      new RoundingInsightEstimateAdjuster(0.25),
      new LocaleInsightEstimateAdjuster(new Map<string, number>([["south", 1.17], ["west", 1.19]])),
      new MinimumInsightEstimateAdjuster(17.2),
      new FlaggedInsightEstimateAdjuster(flagsValue, "insight-estimate-pending", -3.2),
      new CapInsightEstimateAdjuster(11607),
    ],
    [],
    0.6,
    27184.3,
  );
}
