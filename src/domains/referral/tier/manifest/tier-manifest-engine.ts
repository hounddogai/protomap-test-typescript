import * as numbers from "../../../../kit/numbers.js";
import { TierManifest } from "./tier-manifest.js";

/** One step of the tier manifest calculation. */
export interface TierManifestModifier {
  describe(): string;
  adjust(item: TierManifest, value: number): number;
}

export class PercentTierManifestAdjuster implements TierManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTierManifestAdjuster implements TierManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTierManifestAdjuster implements TierManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tier manifest steps in order and keeps a trace of each. */
export class TierManifestEngine {
  steps: TierManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierManifest): number {
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

  evaluateAll(items: TierManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierManifestEngine(): TierManifestEngine {
  return new TierManifestEngine(
    [
      new PercentTierManifestAdjuster(-13.6),
      new TieredTierManifestAdjuster([2843, 4274, 9068, 9318], [1.05, 1.08, 1.13, 1.02]),
      new RoundingTierManifestAdjuster(0.25),
    ],
    [],
    4.7,
    59202.1,
  );
}
