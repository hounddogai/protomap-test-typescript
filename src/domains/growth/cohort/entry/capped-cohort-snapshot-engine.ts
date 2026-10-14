import * as numbers from "../../../../kit/numbers.js";
import { CappedCohortSnapshot } from "./capped-cohort-snapshot.js";

/** One step of the capped cohort snapshot calculation. */
export interface CappedCohortSnapshotStep {
  describe(): string;
  adjust(item: CappedCohortSnapshot, value: number): number;
}

export class RoundingCappedCohortSnapshotAdjuster implements CappedCohortSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedCohortSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleCappedCohortSnapshotAdjuster implements CappedCohortSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedCohortSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumCappedCohortSnapshotAdjuster implements CappedCohortSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedCohortSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCappedCohortSnapshotAdjuster implements CappedCohortSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedCohortSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedCohortSnapshotWeightOffsetAdjuster implements CappedCohortSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: CappedCohortSnapshot, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class TieredCappedCohortSnapshotAdjuster implements CappedCohortSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedCohortSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped cohort snapshot steps in order and keeps a trace of each. */
export class CappedCohortSnapshotEngine {
  steps: CappedCohortSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCohortSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedCohortSnapshot): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: CappedCohortSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedCohortSnapshotEngine(): CappedCohortSnapshotEngine {
  return new CappedCohortSnapshotEngine(
    [
      new RoundingCappedCohortSnapshotAdjuster(0.05),
      new TitleCappedCohortSnapshotAdjuster(new Map<string, number>([["south", 1.3]])),
      new MinimumCappedCohortSnapshotAdjuster(37.2),
      new PercentCappedCohortSnapshotAdjuster(-10.4),
      new CappedCohortSnapshotWeightOffsetAdjuster(0.73),
      new TieredCappedCohortSnapshotAdjuster([2559, 4685], [1.17, 1.01]),
    ],
    [],
    3.6,
    3197.2,
  );
}
