import * as numbers from "../../../../kit/numbers.js";
import { WeightedWarmupThreshold } from "./weighted-warmup-threshold.js";

/** One step of the weighted warmup threshold calculation. */
export interface WeightedWarmupThresholdAdjuster {
  describe(): string;
  adjust(item: WeightedWarmupThreshold, value: number): number;
}

export class TieredWeightedWarmupThresholdAdjuster implements WeightedWarmupThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedWarmupThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWeightedWarmupThresholdAdjuster implements WeightedWarmupThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWarmupThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWeightedWarmupThresholdAdjuster implements WeightedWarmupThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWarmupThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionWeightedWarmupThresholdAdjuster implements WeightedWarmupThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: WeightedWarmupThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedWarmupThresholdAdjuster implements WeightedWarmupThresholdAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWarmupThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted warmup threshold steps in order and keeps a trace of each. */
export class WeightedWarmupThresholdEngine {
  steps: WeightedWarmupThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWarmupThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedWarmupThreshold): number {
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

  evaluateAll(items: WeightedWarmupThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedWarmupThresholdEngine(): WeightedWarmupThresholdEngine {
  return new WeightedWarmupThresholdEngine(
    [
      new TieredWeightedWarmupThresholdAdjuster([1784, 6688], [1.15, 1.18]),
      new RoundingWeightedWarmupThresholdAdjuster(5),
      new CapWeightedWarmupThresholdAdjuster(45041),
      new RegionWeightedWarmupThresholdAdjuster(new Map<string, number>([["retail", 1.14]])),
      new PercentWeightedWarmupThresholdAdjuster(-3.8),
    ],
    [],
    4.2,
    19900.5,
  );
}
