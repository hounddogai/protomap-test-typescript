import * as numbers from "../../../../kit/numbers.js";
import { PrimaryChallengeManifest } from "./primary-challenge-manifest.js";

/** One step of the primary challenge manifest calculation. */
export interface PrimaryChallengeManifestAdjuster {
  describe(): string;
  adjust(item: PrimaryChallengeManifest, value: number): number;
}

export class CategoryPrimaryChallengeManifestAdjuster implements PrimaryChallengeManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PrimaryChallengeManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryChallengeManifestAdjuster implements PrimaryChallengeManifestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryChallengeManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPrimaryChallengeManifestAdjuster implements PrimaryChallengeManifestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryChallengeManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPrimaryChallengeManifestAdjuster implements PrimaryChallengeManifestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryChallengeManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimaryChallengeManifestAdjuster implements PrimaryChallengeManifestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryChallengeManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPrimaryChallengeManifestAdjuster implements PrimaryChallengeManifestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryChallengeManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary challenge manifest steps in order and keeps a trace of each. */
export class PrimaryChallengeManifestEngine {
  steps: PrimaryChallengeManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryChallengeManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryChallengeManifest): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PrimaryChallengeManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryChallengeManifestEngine(): PrimaryChallengeManifestEngine {
  return new PrimaryChallengeManifestEngine(
    [
      new CategoryPrimaryChallengeManifestAdjuster(
        new Map<string, number>([["west", 0.91], ["south", 0.76], ["central", 0.91]]),
      ),
      new TieredPrimaryChallengeManifestAdjuster([5701, 8200], [1.01, 0.93]),
      new RoundingPrimaryChallengeManifestAdjuster(0.25),
      new PercentPrimaryChallengeManifestAdjuster(24),
      new MinimumPrimaryChallengeManifestAdjuster(17.1),
      new CapPrimaryChallengeManifestAdjuster(10087),
    ],
    [],
    0.2,
    79518.4,
  );
}
