import * as numbers from "../../../../kit/numbers.js";
import { StreakManifest } from "./streak-manifest.js";

/** One step of the streak manifest calculation. */
export interface StreakManifestStep {
  describe(): string;
  adjust(item: StreakManifest, value: number): number;
}

export class RoundingStreakManifestAdjuster implements StreakManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStreakManifestAdjuster implements StreakManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStreakManifestAdjuster implements StreakManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryStreakManifestAdjuster implements StreakManifestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: StreakManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak manifest steps in order and keeps a trace of each. */
export class StreakManifestEngine {
  steps: StreakManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StreakManifest): number {
    let current = item.weightedValue();
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

  evaluateAll(items: StreakManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStreakManifestEngine(): StreakManifestEngine {
  return new StreakManifestEngine(
    [
      new RoundingStreakManifestAdjuster(0.1),
      new TieredStreakManifestAdjuster([190, 2969, 4981], [1.04, 0.98, 0.98]),
      new CapStreakManifestAdjuster(49931),
      new CountryStreakManifestAdjuster(new Map<string, number>([["north", 1.06]])),
    ],
    [],
    2,
    55990.8,
  );
}
