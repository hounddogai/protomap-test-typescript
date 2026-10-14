import * as numbers from "../../../../kit/numbers.js";
import { WeightedJourneyBatch } from "./weighted-journey-batch.js";

/** One step of the weighted journey batch calculation. */
export interface WeightedJourneyBatchFactor {
  describe(): string;
  adjust(item: WeightedJourneyBatch, value: number): number;
}

export class PercentWeightedJourneyBatchAdjuster implements WeightedJourneyBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedJourneyBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedJourneyBatchAdjuster implements WeightedJourneyBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedJourneyBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelWeightedJourneyBatchAdjuster implements WeightedJourneyBatchFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedJourneyBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedJourneyBatchAdjuster implements WeightedJourneyBatchFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedJourneyBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WeightedJourneyBatchMarginOffsetAdjuster implements WeightedJourneyBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: WeightedJourneyBatch, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the weighted journey batch steps in order and keeps a trace of each. */
export class WeightedJourneyBatchEngine {
  steps: WeightedJourneyBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedJourneyBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedJourneyBatch): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: WeightedJourneyBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedJourneyBatchEngine(): WeightedJourneyBatchEngine {
  return new WeightedJourneyBatchEngine(
    [
      new PercentWeightedJourneyBatchAdjuster(7.6),
      new TieredWeightedJourneyBatchAdjuster([1240, 2402, 3934, 5315], [1.03, 0.92, 1, 0.82]),
      new LabelWeightedJourneyBatchAdjuster(
        new Map<string, number>([["north", 1.07], ["west", 0.75], ["retail", 0.81]]),
      ),
      new CapWeightedJourneyBatchAdjuster(11333),
      new WeightedJourneyBatchMarginOffsetAdjuster(0.11),
    ],
    [],
    3.1,
    19032,
  );
}
