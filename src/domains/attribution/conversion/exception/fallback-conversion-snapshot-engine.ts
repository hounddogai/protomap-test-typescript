import * as numbers from "../../../../kit/numbers.js";
import { FallbackConversionSnapshot } from "./fallback-conversion-snapshot.js";

/** One step of the fallback conversion snapshot calculation. */
export interface FallbackConversionSnapshotFactor {
  describe(): string;
  adjust(item: FallbackConversionSnapshot, value: number): number;
}

export class PercentFallbackConversionSnapshotAdjuster implements FallbackConversionSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackConversionSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleFallbackConversionSnapshotAdjuster implements FallbackConversionSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackConversionSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFallbackConversionSnapshotAdjuster implements FallbackConversionSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackConversionSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackConversionSnapshotAdjuster implements FallbackConversionSnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackConversionSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackConversionSnapshotAdjuster implements FallbackConversionSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackConversionSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback conversion snapshot steps in order and keeps a trace of each. */
export class FallbackConversionSnapshotEngine {
  steps: FallbackConversionSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackConversionSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackConversionSnapshot): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: FallbackConversionSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackConversionSnapshotEngine(): FallbackConversionSnapshotEngine {
  return new FallbackConversionSnapshotEngine(
    [
      new PercentFallbackConversionSnapshotAdjuster(14.8),
      new LocaleFallbackConversionSnapshotAdjuster(
        new Map<string, number>([["east", 1.34], ["north", 1.16], ["south", 0.89]]),
      ),
      new CapFallbackConversionSnapshotAdjuster(35946),
      new MinimumFallbackConversionSnapshotAdjuster(18.5),
      new TieredFallbackConversionSnapshotAdjuster([3796, 4791, 6653], [0.99, 0.82, 1.18]),
    ],
    [],
    2.8,
    27023.6,
  );
}
