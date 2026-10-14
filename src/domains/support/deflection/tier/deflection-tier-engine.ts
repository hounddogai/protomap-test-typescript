import * as numbers from "../../../../kit/numbers.js";
import { DeflectionTier } from "./deflection-tier.js";

/** One step of the deflection tier calculation. */
export interface DeflectionTierAdjuster {
  describe(): string;
  adjust(item: DeflectionTier, value: number): number;
}

export class RoundingDeflectionTierAdjuster implements DeflectionTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDeflectionTierAdjuster implements DeflectionTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleDeflectionTierAdjuster implements DeflectionTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DeflectionTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDeflectionTierAdjuster implements DeflectionTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DeflectionTierRateOffsetAdjuster implements DeflectionTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: DeflectionTier, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumDeflectionTierAdjuster implements DeflectionTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the deflection tier steps in order and keeps a trace of each. */
export class DeflectionTierEngine {
  steps: DeflectionTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionTier): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DeflectionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionTierEngine(): DeflectionTierEngine {
  return new DeflectionTierEngine(
    [
      new RoundingDeflectionTierAdjuster(0.25),
      new TieredDeflectionTierAdjuster([2710, 2986, 4498, 9448], [1.1, 0.89, 1.14, 0.82]),
      new TitleDeflectionTierAdjuster(new Map<string, number>([["south", 1.25]])),
      new CapDeflectionTierAdjuster(1181),
      new DeflectionTierRateOffsetAdjuster(0.41),
      new MinimumDeflectionTierAdjuster(26.9),
    ],
    [],
    2.9,
    78767.5,
  );
}
