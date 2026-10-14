import * as numbers from "../../../../kit/numbers.js";
import { StrictWarmupManifest } from "./strict-warmup-manifest.js";

/** One step of the strict warmup manifest calculation. */
export interface StrictWarmupManifestFactor {
  describe(): string;
  adjust(item: StrictWarmupManifest, value: number): number;
}

export class TieredStrictWarmupManifestAdjuster implements StrictWarmupManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictWarmupManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionStrictWarmupManifestAdjuster implements StrictWarmupManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: StrictWarmupManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingStrictWarmupManifestAdjuster implements StrictWarmupManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictWarmupManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictWarmupManifestAdjuster implements StrictWarmupManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictWarmupManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict warmup manifest steps in order and keeps a trace of each. */
export class StrictWarmupManifestEngine {
  steps: StrictWarmupManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictWarmupManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictWarmupManifest): number {
    let current = item.netExposure();
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

  evaluateAll(items: StrictWarmupManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictWarmupManifestEngine(): StrictWarmupManifestEngine {
  return new StrictWarmupManifestEngine(
    [
      new TieredStrictWarmupManifestAdjuster([1854, 4587], [1.03, 0.89]),
      new RegionStrictWarmupManifestAdjuster(
        new Map<string, number>([["retail", 1.3], ["west", 1.06], ["east", 0.77]]),
      ),
      new RoundingStrictWarmupManifestAdjuster(1),
      new PercentStrictWarmupManifestAdjuster(18.7),
    ],
    [],
    1.1,
    5989.2,
  );
}
