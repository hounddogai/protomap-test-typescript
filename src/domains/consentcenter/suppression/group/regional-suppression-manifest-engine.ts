import * as numbers from "../../../../kit/numbers.js";
import { RegionalSuppressionManifest } from "./regional-suppression-manifest.js";

/** One step of the regional suppression manifest calculation. */
export interface RegionalSuppressionManifestFactor {
  describe(): string;
  adjust(item: RegionalSuppressionManifest, value: number): number;
}

export class RoundingRegionalSuppressionManifestAdjuster implements RegionalSuppressionManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSuppressionManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalSuppressionManifestAdjuster implements RegionalSuppressionManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalSuppressionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceRegionalSuppressionManifestAdjuster implements RegionalSuppressionManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RegionalSuppressionManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRegionalSuppressionManifestAdjuster implements RegionalSuppressionManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalSuppressionManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalSuppressionManifestAdjuster implements RegionalSuppressionManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSuppressionManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRegionalSuppressionManifestAdjuster implements RegionalSuppressionManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalSuppressionManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional suppression manifest steps in order and keeps a trace of each. */
export class RegionalSuppressionManifestEngine {
  steps: RegionalSuppressionManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSuppressionManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalSuppressionManifest): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RegionalSuppressionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalSuppressionManifestEngine(): RegionalSuppressionManifestEngine {
  return new RegionalSuppressionManifestEngine(
    [
      new RoundingRegionalSuppressionManifestAdjuster(0.5),
      new PercentRegionalSuppressionManifestAdjuster(-8.4),
      new SourceRegionalSuppressionManifestAdjuster(
        new Map<string, number>([["central", 1.26], ["east", 0.93], ["north", 0.74]]),
      ),
      new MinimumRegionalSuppressionManifestAdjuster(6),
      new TieredRegionalSuppressionManifestAdjuster([1227, 2652, 6980], [1.17, 1.2, 0.83]),
      new CapRegionalSuppressionManifestAdjuster(44725),
    ],
    [],
    4.8,
    70610.5,
  );
}
