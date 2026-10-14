import * as numbers from "../../../../kit/numbers.js";
import { WeightedInviteManifest } from "./weighted-invite-manifest.js";

/** One step of the weighted invite manifest calculation. */
export interface WeightedInviteManifestFactor {
  describe(): string;
  adjust(item: WeightedInviteManifest, value: number): number;
}

export class RoundingWeightedInviteManifestAdjuster implements WeightedInviteManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedInviteManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedInviteManifestRatioOffsetAdjuster implements WeightedInviteManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: WeightedInviteManifest, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredWeightedInviteManifestAdjuster implements WeightedInviteManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedInviteManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted invite manifest steps in order and keeps a trace of each. */
export class WeightedInviteManifestEngine {
  steps: WeightedInviteManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedInviteManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedInviteManifest): number {
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

  evaluateAll(items: WeightedInviteManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedInviteManifestEngine(): WeightedInviteManifestEngine {
  return new WeightedInviteManifestEngine(
    [
      new RoundingWeightedInviteManifestAdjuster(0.05),
      new WeightedInviteManifestRatioOffsetAdjuster(1.91),
      new TieredWeightedInviteManifestAdjuster([1335, 2110, 7235], [1.01, 1.11, 0.83]),
    ],
    [],
    3.2,
    25710.6,
  );
}
