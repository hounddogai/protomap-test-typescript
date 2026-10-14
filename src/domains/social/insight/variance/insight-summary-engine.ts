import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightSummary } from "./insight-summary.js";

/** One step of the insight summary calculation. */
export interface InsightSummaryFactor {
  describe(): string;
  adjust(item: InsightSummary, value: number): number;
}

export class InsightSummaryCeilingOffsetAdjuster implements InsightSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: InsightSummary, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CountryInsightSummaryAdjuster implements InsightSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: InsightSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInsightSummaryAdjuster implements InsightSummaryFactor {
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

  adjust(item: InsightSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredInsightSummaryAdjuster implements InsightSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the insight summary steps in order and keeps a trace of each. */
export class InsightSummaryEngine {
  steps: InsightSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InsightSummary): number {
    let current = item.weightedValue();
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

  evaluateAll(items: InsightSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInsightSummaryEngine(flagsValue: flags.Registry): InsightSummaryEngine {
  return new InsightSummaryEngine(
    [
      new InsightSummaryCeilingOffsetAdjuster(1.36),
      new CountryInsightSummaryAdjuster(
        new Map<string, number>([["south", 0.7], ["east", 1.23], ["west", 1.07]]),
      ),
      new FlaggedInsightSummaryAdjuster(flagsValue, "insight-summary-lenient", -6.7),
      new TieredInsightSummaryAdjuster([1638, 2022, 3572, 5422], [0.97, 0.97, 0.81, 0.97]),
    ],
    [],
    2.3,
    75138.2,
  );
}
