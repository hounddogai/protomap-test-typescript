import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightBundle } from "./insight-bundle.js";

/** One step of the insight bundle calculation. */
export interface InsightBundleFactor {
  describe(): string;
  adjust(item: InsightBundle, value: number): number;
}

export class PercentInsightBundleAdjuster implements InsightBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedInsightBundleAdjuster implements InsightBundleFactor {
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

  adjust(item: InsightBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredInsightBundleAdjuster implements InsightBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInsightBundleAdjuster implements InsightBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameInsightBundleAdjuster implements InsightBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: InsightBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight bundle steps in order and keeps a trace of each. */
export class InsightBundleEngine {
  steps: InsightBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightBundle): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: InsightBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightBundleEngine(flagsValue: flags.Registry): InsightBundleEngine {
  return new InsightBundleEngine(
    [
      new PercentInsightBundleAdjuster(-19.7),
      new FlaggedInsightBundleAdjuster(flagsValue, "insight-bundle-fallback", 8.2),
      new TieredInsightBundleAdjuster([6373, 9155], [1.15, 0.81]),
      new RoundingInsightBundleAdjuster(0.05),
      new NameInsightBundleAdjuster(new Map<string, number>([["west", 1.08]])),
    ],
    [],
    2.2,
    92871.8,
  );
}
