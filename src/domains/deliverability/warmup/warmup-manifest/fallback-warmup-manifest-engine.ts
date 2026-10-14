import * as numbers from "../../../../kit/numbers.js";
import { FallbackWarmupManifest } from "./fallback-warmup-manifest.js";

/** One step of the fallback warmup manifest calculation. */
export interface FallbackWarmupManifestFactor {
  describe(): string;
  adjust(item: FallbackWarmupManifest, value: number): number;
}

export class MinimumFallbackWarmupManifestAdjuster implements FallbackWarmupManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackWarmupManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackWarmupManifestAdjuster implements FallbackWarmupManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackWarmupManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackWarmupManifestAdjuster implements FallbackWarmupManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackWarmupManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentFallbackWarmupManifestAdjuster implements FallbackWarmupManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackWarmupManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackWarmupManifestAdjuster implements FallbackWarmupManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackWarmupManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback warmup manifest steps in order and keeps a trace of each. */
export class FallbackWarmupManifestEngine {
  steps: FallbackWarmupManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackWarmupManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackWarmupManifest): number {
    let current = item.netValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FallbackWarmupManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackWarmupManifestEngine(): FallbackWarmupManifestEngine {
  return new FallbackWarmupManifestEngine(
    [
      new MinimumFallbackWarmupManifestAdjuster(11.1),
      new RoundingFallbackWarmupManifestAdjuster(0.5),
      new TieredFallbackWarmupManifestAdjuster([376, 6424, 9871], [1.09, 1.07, 1.16]),
      new PercentFallbackWarmupManifestAdjuster(4.3),
      new CapFallbackWarmupManifestAdjuster(10396),
    ],
    [],
    4.1,
    64017.2,
  );
}
