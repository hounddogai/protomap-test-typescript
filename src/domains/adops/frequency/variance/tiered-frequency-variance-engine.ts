import * as numbers from "../../../../kit/numbers.js";
import { TieredFrequencyVariance } from "./tiered-frequency-variance.js";

/** One step of the tiered frequency variance calculation. */
export interface TieredFrequencyVarianceAdjuster {
  describe(): string;
  adjust(item: TieredFrequencyVariance, value: number): number;
}

export class TieredTieredFrequencyVarianceAdjuster implements TieredFrequencyVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredFrequencyVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredFrequencyVarianceAdjuster implements TieredFrequencyVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredFrequencyVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFrequencyVarianceDiscountOffsetAdjuster implements TieredFrequencyVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: TieredFrequencyVariance, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class UtmSourceTieredFrequencyVarianceAdjuster implements TieredFrequencyVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: TieredFrequencyVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredFrequencyVarianceAdjuster implements TieredFrequencyVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredFrequencyVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredFrequencyVarianceAdjuster implements TieredFrequencyVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredFrequencyVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered frequency variance steps in order and keeps a trace of each. */
export class TieredFrequencyVarianceEngine {
  steps: TieredFrequencyVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFrequencyVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredFrequencyVariance): number {
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

  evaluateAll(items: TieredFrequencyVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredFrequencyVarianceEngine(): TieredFrequencyVarianceEngine {
  return new TieredFrequencyVarianceEngine(
    [
      new TieredTieredFrequencyVarianceAdjuster([213, 2204, 6056, 9451], [1.08, 1.14, 0.95, 0.93]),
      new RoundingTieredFrequencyVarianceAdjuster(1),
      new TieredFrequencyVarianceDiscountOffsetAdjuster(0.8),
      new UtmSourceTieredFrequencyVarianceAdjuster(
        new Map<string, number>([["north", 1.23], ["online", 1.36], ["retail", 1.18]]),
      ),
      new CapTieredFrequencyVarianceAdjuster(1437),
      new MinimumTieredFrequencyVarianceAdjuster(23.1),
    ],
    [],
    4.5,
    1221.7,
  );
}
