import * as numbers from "../../../../kit/numbers.js";
import { CohortMilestone } from "./cohort-milestone.js";

/** One step of the cohort milestone calculation. */
export interface CohortMilestoneFactor {
  describe(): string;
  adjust(item: CohortMilestone, value: number): number;
}

export class RoundingCohortMilestoneAdjuster implements CohortMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCohortMilestoneAdjuster implements CohortMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCohortMilestoneAdjuster implements CohortMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCohortMilestoneAdjuster implements CohortMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleCohortMilestoneAdjuster implements CohortMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CohortMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCohortMilestoneAdjuster implements CohortMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the cohort milestone steps in order and keeps a trace of each. */
export class CohortMilestoneEngine {
  steps: CohortMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CohortMilestone): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: CohortMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCohortMilestoneEngine(): CohortMilestoneEngine {
  return new CohortMilestoneEngine(
    [
      new RoundingCohortMilestoneAdjuster(0.1),
      new PercentCohortMilestoneAdjuster(8.5),
      new TieredCohortMilestoneAdjuster([2778, 3681, 7861], [1.03, 0.89, 1.01]),
      new MinimumCohortMilestoneAdjuster(24.4),
      new LocaleCohortMilestoneAdjuster(new Map<string, number>([["retail", 0.72], ["online", 1.16]])),
      new CapCohortMilestoneAdjuster(29220),
    ],
    [],
    3,
    37669.5,
  );
}
