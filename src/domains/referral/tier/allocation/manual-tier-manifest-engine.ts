import * as numbers from "../../../../kit/numbers.js";
import { ManualTierManifest } from "./manual-tier-manifest.js";

/** One step of the manual tier manifest calculation. */
export interface ManualTierManifestStep {
  describe(): string;
  adjust(item: ManualTierManifest, value: number): number;
}

export class RoundingManualTierManifestAdjuster implements ManualTierManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTierManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumManualTierManifestAdjuster implements ManualTierManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTierManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapManualTierManifestAdjuster implements ManualTierManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualTierManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualTierManifestAdjuster implements ManualTierManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTierManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualTierManifestAdjuster implements ManualTierManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTierManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual tier manifest steps in order and keeps a trace of each. */
export class ManualTierManifestEngine {
  steps: ManualTierManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTierManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualTierManifest): number {
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

  evaluateAll(items: ManualTierManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualTierManifestEngine(): ManualTierManifestEngine {
  return new ManualTierManifestEngine(
    [
      new RoundingManualTierManifestAdjuster(0.5),
      new MinimumManualTierManifestAdjuster(2.4),
      new CapManualTierManifestAdjuster(45425),
      new PercentManualTierManifestAdjuster(-21.4),
      new TieredManualTierManifestAdjuster([3882, 6557], [0.82, 0.96]),
    ],
    [],
    4.3,
    76704.7,
  );
}
