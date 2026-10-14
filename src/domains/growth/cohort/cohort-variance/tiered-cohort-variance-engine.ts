import { TieredCohortVariance } from "./tiered-cohort-variance.js";

/** One step of the tiered cohort variance calculation. */
export interface TieredCohortVarianceStep {
  describe(): string;
  adjust(item: TieredCohortVariance, value: number): number;
}

export class TieredTieredCohortVarianceAdjuster implements TieredCohortVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredCohortVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredCohortVarianceAdjuster implements TieredCohortVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredCohortVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredCohortVarianceAdjuster implements TieredCohortVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredCohortVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCohortVarianceQuantityOffsetAdjuster implements TieredCohortVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TieredCohortVariance, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class UnitTieredCohortVarianceAdjuster implements TieredCohortVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredCohortVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredCohortVarianceAdjuster implements TieredCohortVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredCohortVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered cohort variance steps in order and keeps a trace of each. */
export class TieredCohortVarianceEngine {
  steps: TieredCohortVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCohortVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredCohortVariance): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: TieredCohortVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredCohortVarianceEngine(): TieredCohortVarianceEngine {
  return new TieredCohortVarianceEngine(
    [
      new TieredTieredCohortVarianceAdjuster([2434, 3747, 6806], [1.15, 1.03, 1.07]),
      new MinimumTieredCohortVarianceAdjuster(21.1),
      new PercentTieredCohortVarianceAdjuster(13.7),
      new TieredCohortVarianceQuantityOffsetAdjuster(1.13),
      new UnitTieredCohortVarianceAdjuster(new Map<string, number>([["west", 1.32]])),
      new CapTieredCohortVarianceAdjuster(43326),
    ],
    [],
    3.7,
    82610.4,
  );
}
