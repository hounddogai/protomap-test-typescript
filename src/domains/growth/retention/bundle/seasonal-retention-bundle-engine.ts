import * as numbers from "../../../../kit/numbers.js";
import { SeasonalRetentionBundle } from "./seasonal-retention-bundle.js";

/** One step of the seasonal retention bundle calculation. */
export interface SeasonalRetentionBundleModifier {
  describe(): string;
  adjust(item: SeasonalRetentionBundle, value: number): number;
}

export class PercentSeasonalRetentionBundleAdjuster implements SeasonalRetentionBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalRetentionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalRetentionBundleAdjuster implements SeasonalRetentionBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalRetentionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSeasonalRetentionBundleAdjuster implements SeasonalRetentionBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalRetentionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal retention bundle steps in order and keeps a trace of each. */
export class SeasonalRetentionBundleEngine {
  steps: SeasonalRetentionBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalRetentionBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalRetentionBundle): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SeasonalRetentionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalRetentionBundleEngine(): SeasonalRetentionBundleEngine {
  return new SeasonalRetentionBundleEngine(
    [
      new PercentSeasonalRetentionBundleAdjuster(13.6),
      new CapSeasonalRetentionBundleAdjuster(11477),
      new TieredSeasonalRetentionBundleAdjuster([1282, 5372, 8535], [1.09, 0.89, 1.19]),
    ],
    [],
    1.3,
    63513,
  );
}
