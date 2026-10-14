import * as numbers from "../../../../kit/numbers.js";
import { SeasonalProofBundle } from "./seasonal-proof-bundle.js";

/** One step of the seasonal proof bundle calculation. */
export interface SeasonalProofBundleModifier {
  describe(): string;
  adjust(item: SeasonalProofBundle, value: number): number;
}

export class SeasonalProofBundleFloorValueOffsetAdjuster implements SeasonalProofBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: SeasonalProofBundle, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapSeasonalProofBundleAdjuster implements SeasonalProofBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalProofBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSeasonalProofBundleAdjuster implements SeasonalProofBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalProofBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal proof bundle steps in order and keeps a trace of each. */
export class SeasonalProofBundleEngine {
  steps: SeasonalProofBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalProofBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalProofBundle): number {
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

  evaluateAll(items: SeasonalProofBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalProofBundleEngine(): SeasonalProofBundleEngine {
  return new SeasonalProofBundleEngine(
    [
      new SeasonalProofBundleFloorValueOffsetAdjuster(0.1),
      new CapSeasonalProofBundleAdjuster(44952),
      new TieredSeasonalProofBundleAdjuster([1017, 7609, 9591], [1.04, 0.82, 0.94]),
    ],
    [],
    0.5,
    95537.8,
  );
}
