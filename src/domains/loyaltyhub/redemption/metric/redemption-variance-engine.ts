import * as numbers from "../../../../kit/numbers.js";
import { RedemptionVariance } from "./redemption-variance.js";

/** One step of the redemption variance calculation. */
export interface RedemptionVarianceModifier {
  describe(): string;
  adjust(item: RedemptionVariance, value: number): number;
}

export class RedemptionVarianceFloorValueOffsetAdjuster implements RedemptionVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: RedemptionVariance, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapRedemptionVarianceAdjuster implements RedemptionVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRedemptionVarianceAdjuster implements RedemptionVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRedemptionVarianceAdjuster implements RedemptionVarianceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the redemption variance steps in order and keeps a trace of each. */
export class RedemptionVarianceEngine {
  steps: RedemptionVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RedemptionVariance): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RedemptionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRedemptionVarianceEngine(): RedemptionVarianceEngine {
  return new RedemptionVarianceEngine(
    [
      new RedemptionVarianceFloorValueOffsetAdjuster(0.45),
      new CapRedemptionVarianceAdjuster(44755),
      new TieredRedemptionVarianceAdjuster([357, 2425, 3658, 7506], [0.94, 0.91, 1.06, 0.92]),
      new MinimumRedemptionVarianceAdjuster(48.7),
    ],
    [],
    3,
    25623.8,
  );
}
