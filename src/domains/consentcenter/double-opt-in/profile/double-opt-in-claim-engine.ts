import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInClaim } from "./double-opt-in-claim.js";

/** One step of the double opt in claim calculation. */
export interface DoubleOptInClaimAdjuster {
  describe(): string;
  adjust(item: DoubleOptInClaim, value: number): number;
}

export class PercentDoubleOptInClaimAdjuster implements DoubleOptInClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentDoubleOptInClaimAdjuster implements DoubleOptInClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DoubleOptInClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumDoubleOptInClaimAdjuster implements DoubleOptInClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDoubleOptInClaimAdjuster implements DoubleOptInClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDoubleOptInClaimAdjuster implements DoubleOptInClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDoubleOptInClaimAdjuster implements DoubleOptInClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the double opt in claim steps in order and keeps a trace of each. */
export class DoubleOptInClaimEngine {
  steps: DoubleOptInClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DoubleOptInClaim): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: DoubleOptInClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDoubleOptInClaimEngine(): DoubleOptInClaimEngine {
  return new DoubleOptInClaimEngine(
    [
      new PercentDoubleOptInClaimAdjuster(15.4),
      new SegmentDoubleOptInClaimAdjuster(
        new Map<string, number>([["north", 0.71], ["west", 1.14], ["central", 1.07]]),
      ),
      new MinimumDoubleOptInClaimAdjuster(14.1),
      new TieredDoubleOptInClaimAdjuster([5017, 5962, 7851, 8556], [1.14, 1.15, 1.07, 0.86]),
      new RoundingDoubleOptInClaimAdjuster(0.1),
      new CapDoubleOptInClaimAdjuster(21051),
    ],
    [],
    1.6,
    41510,
  );
}
