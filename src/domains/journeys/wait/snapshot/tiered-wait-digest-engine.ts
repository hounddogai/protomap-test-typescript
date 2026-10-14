import * as numbers from "../../../../kit/numbers.js";
import { TieredWaitDigest } from "./tiered-wait-digest.js";

/** One step of the tiered wait digest calculation. */
export interface TieredWaitDigestAdjuster {
  describe(): string;
  adjust(item: TieredWaitDigest, value: number): number;
}

export class TieredTieredWaitDigestAdjuster implements TieredWaitDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredWaitDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTieredWaitDigestAdjuster implements TieredWaitDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredWaitDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredWaitDigestAdjuster implements TieredWaitDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredWaitDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered wait digest steps in order and keeps a trace of each. */
export class TieredWaitDigestEngine {
  steps: TieredWaitDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWaitDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredWaitDigest): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: TieredWaitDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredWaitDigestEngine(): TieredWaitDigestEngine {
  return new TieredWaitDigestEngine(
    [
      new TieredTieredWaitDigestAdjuster([2228, 3454, 4602], [1.08, 0.97, 0.85]),
      new PercentTieredWaitDigestAdjuster(23.3),
      new MinimumTieredWaitDigestAdjuster(33.9),
    ],
    [],
    3.5,
    56439.2,
  );
}
