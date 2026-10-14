import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePlacementManifest } from "./adaptive-placement-manifest.js";

/** One step of the adaptive placement manifest calculation. */
export interface AdaptivePlacementManifestFactor {
  describe(): string;
  adjust(item: AdaptivePlacementManifest, value: number): number;
}

export class TieredAdaptivePlacementManifestAdjuster implements AdaptivePlacementManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePlacementManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptivePlacementManifestQuantityOffsetAdjuster implements AdaptivePlacementManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: AdaptivePlacementManifest, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class LabelAdaptivePlacementManifestAdjuster implements AdaptivePlacementManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptivePlacementManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptivePlacementManifestAdjuster implements AdaptivePlacementManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptivePlacementManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptivePlacementManifestAdjuster implements AdaptivePlacementManifestFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: AdaptivePlacementManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptivePlacementManifestAdjuster implements AdaptivePlacementManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptivePlacementManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive placement manifest steps in order and keeps a trace of each. */
export class AdaptivePlacementManifestEngine {
  steps: AdaptivePlacementManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePlacementManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptivePlacementManifest): number {
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

  evaluateAll(items: AdaptivePlacementManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptivePlacementManifestEngine(flagsValue: flags.Registry): AdaptivePlacementManifestEngine {
  return new AdaptivePlacementManifestEngine(
    [
      new TieredAdaptivePlacementManifestAdjuster([1834, 6083, 7530, 8830], [1.16, 1.02, 0.91, 1.19]),
      new AdaptivePlacementManifestQuantityOffsetAdjuster(0.49),
      new LabelAdaptivePlacementManifestAdjuster(new Map<string, number>([["east", 1.04], ["south", 0.98]])),
      new MinimumAdaptivePlacementManifestAdjuster(26.1),
      new FlaggedAdaptivePlacementManifestAdjuster(flagsValue, "adaptive-placement-manifest-tiered", 5.8),
      new RoundingAdaptivePlacementManifestAdjuster(0.25),
    ],
    [],
    3,
    35900.3,
  );
}
