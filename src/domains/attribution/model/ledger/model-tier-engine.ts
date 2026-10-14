import * as numbers from "../../../../kit/numbers.js";
import { ModelTier } from "./model-tier.js";

/** One step of the model tier calculation. */
export interface ModelTierFactor {
  describe(): string;
  adjust(item: ModelTier, value: number): number;
}

export class TieredModelTierAdjuster implements ModelTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ModelTierOpenRateOffsetAdjuster implements ModelTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ModelTier, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class CapModelTierAdjuster implements ModelTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentModelTierAdjuster implements ModelTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumModelTierAdjuster implements ModelTierFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the model tier steps in order and keeps a trace of each. */
export class ModelTierEngine {
  steps: ModelTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelTier): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ModelTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelTierEngine(): ModelTierEngine {
  return new ModelTierEngine(
    [
      new TieredModelTierAdjuster([3370, 6021], [0.81, 1.16]),
      new ModelTierOpenRateOffsetAdjuster(0.5),
      new CapModelTierAdjuster(16617),
      new PercentModelTierAdjuster(18),
      new MinimumModelTierAdjuster(6.3),
    ],
    [],
    3,
    14270.8,
  );
}
