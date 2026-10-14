import * as numbers from "../../../../kit/numbers.js";
import { RetentionBundle } from "./retention-bundle.js";

/** One step of the retention bundle calculation. */
export interface RetentionBundleStep {
  describe(): string;
  adjust(item: RetentionBundle, value: number): number;
}

export class MinimumRetentionBundleAdjuster implements RetentionBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRetentionBundleAdjuster implements RetentionBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRetentionBundleAdjuster implements RetentionBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRetentionBundleAdjuster implements RetentionBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention bundle steps in order and keeps a trace of each. */
export class RetentionBundleEngine {
  steps: RetentionBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RetentionBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RetentionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRetentionBundleEngine(): RetentionBundleEngine {
  return new RetentionBundleEngine(
    [
      new MinimumRetentionBundleAdjuster(12.4),
      new TieredRetentionBundleAdjuster([6634, 6640, 8273, 9366], [1.11, 1, 0.83, 1.09]),
      new CapRetentionBundleAdjuster(8354),
      new PercentRetentionBundleAdjuster(15.5),
    ],
    [],
    4.7,
    31128.3,
  );
}
