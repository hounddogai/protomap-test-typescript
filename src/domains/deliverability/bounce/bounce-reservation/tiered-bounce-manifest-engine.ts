import * as numbers from "../../../../kit/numbers.js";
import { TieredBounceManifest } from "./tiered-bounce-manifest.js";

/** One step of the tiered bounce manifest calculation. */
export interface TieredBounceManifestStep {
  describe(): string;
  adjust(item: TieredBounceManifest, value: number): number;
}

export class PercentTieredBounceManifestAdjuster implements TieredBounceManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBounceManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredBounceManifestAdjuster implements TieredBounceManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBounceManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentTieredBounceManifestAdjuster implements TieredBounceManifestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TieredBounceManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBounceManifestMinimumOffsetAdjuster implements TieredBounceManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: TieredBounceManifest, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class TieredTieredBounceManifestAdjuster implements TieredBounceManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBounceManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered bounce manifest steps in order and keeps a trace of each. */
export class TieredBounceManifestEngine {
  steps: TieredBounceManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBounceManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredBounceManifest): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: TieredBounceManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredBounceManifestEngine(): TieredBounceManifestEngine {
  return new TieredBounceManifestEngine(
    [
      new PercentTieredBounceManifestAdjuster(9.5),
      new CapTieredBounceManifestAdjuster(42693),
      new SegmentTieredBounceManifestAdjuster(new Map<string, number>([["online", 1.19]])),
      new TieredBounceManifestMinimumOffsetAdjuster(0.16),
      new TieredTieredBounceManifestAdjuster([3561, 7547], [1.19, 1.2]),
    ],
    [],
    2.4,
    26725.5,
  );
}
