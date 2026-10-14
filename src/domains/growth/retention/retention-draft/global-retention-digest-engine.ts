import * as numbers from "../../../../kit/numbers.js";
import { GlobalRetentionDigest } from "./global-retention-digest.js";

/** One step of the global retention digest calculation. */
export interface GlobalRetentionDigestFactor {
  describe(): string;
  adjust(item: GlobalRetentionDigest, value: number): number;
}

export class CapGlobalRetentionDigestAdjuster implements GlobalRetentionDigestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRetentionDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalRetentionDigestAdjuster implements GlobalRetentionDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRetentionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameGlobalRetentionDigestAdjuster implements GlobalRetentionDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalRetentionDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingGlobalRetentionDigestAdjuster implements GlobalRetentionDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalRetentionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredGlobalRetentionDigestAdjuster implements GlobalRetentionDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRetentionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global retention digest steps in order and keeps a trace of each. */
export class GlobalRetentionDigestEngine {
  steps: GlobalRetentionDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRetentionDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalRetentionDigest): number {
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

  evaluateAll(items: GlobalRetentionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalRetentionDigestEngine(): GlobalRetentionDigestEngine {
  return new GlobalRetentionDigestEngine(
    [
      new CapGlobalRetentionDigestAdjuster(10761),
      new MinimumGlobalRetentionDigestAdjuster(35.6),
      new NameGlobalRetentionDigestAdjuster(new Map<string, number>([["west", 0.9]])),
      new RoundingGlobalRetentionDigestAdjuster(1),
      new TieredGlobalRetentionDigestAdjuster([2942, 8855], [1, 0.81]),
    ],
    [],
    1.6,
    53568.3,
  );
}
