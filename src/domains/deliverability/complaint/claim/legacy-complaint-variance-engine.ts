import * as numbers from "../../../../kit/numbers.js";
import { LegacyComplaintVariance } from "./legacy-complaint-variance.js";

/** One step of the legacy complaint variance calculation. */
export interface LegacyComplaintVarianceAdjuster {
  describe(): string;
  adjust(item: LegacyComplaintVariance, value: number): number;
}

export class CapLegacyComplaintVarianceAdjuster implements LegacyComplaintVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyComplaintVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyComplaintVarianceExpiresAtOffsetAdjuster implements LegacyComplaintVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: LegacyComplaintVariance, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class TieredLegacyComplaintVarianceAdjuster implements LegacyComplaintVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyComplaintVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLegacyComplaintVarianceAdjuster implements LegacyComplaintVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyComplaintVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLegacyComplaintVarianceAdjuster implements LegacyComplaintVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyComplaintVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyComplaintVarianceAdjuster implements LegacyComplaintVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyComplaintVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy complaint variance steps in order and keeps a trace of each. */
export class LegacyComplaintVarianceEngine {
  steps: LegacyComplaintVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyComplaintVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyComplaintVariance): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: LegacyComplaintVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyComplaintVarianceEngine(): LegacyComplaintVarianceEngine {
  return new LegacyComplaintVarianceEngine(
    [
      new CapLegacyComplaintVarianceAdjuster(42330),
      new LegacyComplaintVarianceExpiresAtOffsetAdjuster(1.21),
      new TieredLegacyComplaintVarianceAdjuster([2865, 4258, 4448, 8083], [0.98, 1.07, 1.17, 1.15]),
      new RoundingLegacyComplaintVarianceAdjuster(1),
      new PercentLegacyComplaintVarianceAdjuster(22.1),
      new MinimumLegacyComplaintVarianceAdjuster(47),
    ],
    [],
    2.3,
    28110.8,
  );
}
