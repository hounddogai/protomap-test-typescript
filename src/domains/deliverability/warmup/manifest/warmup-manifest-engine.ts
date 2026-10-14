import * as numbers from "../../../../kit/numbers.js";
import { WarmupManifest } from "./warmup-manifest.js";

/** One step of the warmup manifest calculation. */
export interface WarmupManifestFactor {
  describe(): string;
  adjust(item: WarmupManifest, value: number): number;
}

export class UnitWarmupManifestAdjuster implements WarmupManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: WarmupManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWarmupManifestAdjuster implements WarmupManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWarmupManifestAdjuster implements WarmupManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWarmupManifestAdjuster implements WarmupManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWarmupManifestAdjuster implements WarmupManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the warmup manifest steps in order and keeps a trace of each. */
export class WarmupManifestEngine {
  steps: WarmupManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WarmupManifest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WarmupManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWarmupManifestEngine(): WarmupManifestEngine {
  return new WarmupManifestEngine(
    [
      new UnitWarmupManifestAdjuster(
        new Map<string, number>([["retail", 1.03], ["central", 0.98], ["online", 0.89]]),
      ),
      new MinimumWarmupManifestAdjuster(43.7),
      new TieredWarmupManifestAdjuster([348, 7047], [1.16, 0.91]),
      new RoundingWarmupManifestAdjuster(0.1),
      new CapWarmupManifestAdjuster(15247),
    ],
    [],
    3.5,
    8113.3,
  );
}
