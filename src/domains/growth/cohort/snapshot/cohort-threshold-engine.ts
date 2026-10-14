import * as numbers from "../../../../kit/numbers.js";
import { CohortThreshold } from "./cohort-threshold.js";

/** One step of the cohort threshold calculation. */
export interface CohortThresholdFactor {
  describe(): string;
  adjust(item: CohortThreshold, value: number): number;
}

export class TieredCohortThresholdAdjuster implements CohortThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCohortThresholdAdjuster implements CohortThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCohortThresholdAdjuster implements CohortThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CohortThresholdClicksOffsetAdjuster implements CohortThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: CohortThreshold, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class CapCohortThresholdAdjuster implements CohortThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCohortThresholdAdjuster implements CohortThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the cohort threshold steps in order and keeps a trace of each. */
export class CohortThresholdEngine {
  steps: CohortThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CohortThreshold): number {
    let current = item.weightedValue();
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

  evaluateAll(items: CohortThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCohortThresholdEngine(): CohortThresholdEngine {
  return new CohortThresholdEngine(
    [
      new TieredCohortThresholdAdjuster([2368, 5453, 7318], [1.1, 1.12, 0.83]),
      new MinimumCohortThresholdAdjuster(28),
      new PercentCohortThresholdAdjuster(14.8),
      new CohortThresholdClicksOffsetAdjuster(0.66),
      new CapCohortThresholdAdjuster(38823),
      new RoundingCohortThresholdAdjuster(0.1),
    ],
    [],
    3.8,
    60020.6,
  );
}
