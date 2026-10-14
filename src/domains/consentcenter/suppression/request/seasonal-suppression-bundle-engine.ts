import * as numbers from "../../../../kit/numbers.js";
import { SeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

/** One step of the seasonal suppression bundle calculation. */
export interface SeasonalSuppressionBundleModifier {
  describe(): string;
  adjust(item: SeasonalSuppressionBundle, value: number): number;
}

export class SegmentSeasonalSuppressionBundleAdjuster implements SeasonalSuppressionBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SeasonalSuppressionBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalSuppressionBundleAdjuster implements SeasonalSuppressionBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalSuppressionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalSuppressionBundleMarginOffsetAdjuster implements SeasonalSuppressionBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: SeasonalSuppressionBundle, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class RoundingSeasonalSuppressionBundleAdjuster implements SeasonalSuppressionBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalSuppressionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal suppression bundle steps in order and keeps a trace of each. */
export class SeasonalSuppressionBundleEngine {
  steps: SeasonalSuppressionBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSuppressionBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalSuppressionBundle): number {
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

  evaluateAll(items: SeasonalSuppressionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalSuppressionBundleEngine(): SeasonalSuppressionBundleEngine {
  return new SeasonalSuppressionBundleEngine(
    [
      new SegmentSeasonalSuppressionBundleAdjuster(new Map<string, number>([["south", 1.13]])),
      new TieredSeasonalSuppressionBundleAdjuster([2217, 2616, 4544, 4714], [0.91, 1.02, 1.1, 1.13]),
      new SeasonalSuppressionBundleMarginOffsetAdjuster(0.68),
      new RoundingSeasonalSuppressionBundleAdjuster(0.25),
    ],
    [],
    4.7,
    63476.6,
  );
}
