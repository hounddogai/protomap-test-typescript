import * as numbers from "../../../../kit/numbers.js";
import { WeightedRedemptionManifest } from "./weighted-redemption-manifest.js";

/** One step of the weighted redemption manifest calculation. */
export interface WeightedRedemptionManifestAdjuster {
  describe(): string;
  adjust(item: WeightedRedemptionManifest, value: number): number;
}

export class PercentWeightedRedemptionManifestAdjuster implements WeightedRedemptionManifestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedRedemptionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedRedemptionManifestAdjuster implements WeightedRedemptionManifestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedRedemptionManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedRedemptionManifestAdjuster implements WeightedRedemptionManifestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedRedemptionManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWeightedRedemptionManifestAdjuster implements WeightedRedemptionManifestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRedemptionManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedRedemptionManifestQuantityOffsetAdjuster implements WeightedRedemptionManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: WeightedRedemptionManifest, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class LabelWeightedRedemptionManifestAdjuster implements WeightedRedemptionManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedRedemptionManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted redemption manifest steps in order and keeps a trace of each. */
export class WeightedRedemptionManifestEngine {
  steps: WeightedRedemptionManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRedemptionManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedRedemptionManifest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedRedemptionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedRedemptionManifestEngine(): WeightedRedemptionManifestEngine {
  return new WeightedRedemptionManifestEngine(
    [
      new PercentWeightedRedemptionManifestAdjuster(2.2),
      new CapWeightedRedemptionManifestAdjuster(3952),
      new TieredWeightedRedemptionManifestAdjuster([6196, 8467], [0.98, 0.9]),
      new RoundingWeightedRedemptionManifestAdjuster(5),
      new WeightedRedemptionManifestQuantityOffsetAdjuster(1.95),
      new LabelWeightedRedemptionManifestAdjuster(new Map<string, number>([["west", 1.24], ["south", 1.31]])),
    ],
    [],
    1.3,
    16009.8,
  );
}
