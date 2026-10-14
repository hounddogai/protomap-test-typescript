import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredCreativeManifest } from "./tiered-creative-manifest.js";

/** One step of the tiered creative manifest calculation. */
export interface TieredCreativeManifestStep {
  describe(): string;
  adjust(item: TieredCreativeManifest, value: number): number;
}

export class PercentTieredCreativeManifestAdjuster implements TieredCreativeManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredCreativeManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredCreativeManifestAdjuster implements TieredCreativeManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredCreativeManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredCreativeManifestAdjuster implements TieredCreativeManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredCreativeManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredCreativeManifestAdjuster implements TieredCreativeManifestStep {
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

  adjust(item: TieredCreativeManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered creative manifest steps in order and keeps a trace of each. */
export class TieredCreativeManifestEngine {
  steps: TieredCreativeManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCreativeManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredCreativeManifest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredCreativeManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredCreativeManifestEngine(flagsValue: flags.Registry): TieredCreativeManifestEngine {
  return new TieredCreativeManifestEngine(
    [
      new PercentTieredCreativeManifestAdjuster(-9.3),
      new TieredTieredCreativeManifestAdjuster([1414, 3169], [0.99, 1.09]),
      new RoundingTieredCreativeManifestAdjuster(0.5),
      new FlaggedTieredCreativeManifestAdjuster(flagsValue, "tiered-creative-manifest-capped", 3.2),
    ],
    [],
    4.9,
    44082.1,
  );
}
