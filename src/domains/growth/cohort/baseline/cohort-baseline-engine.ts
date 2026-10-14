import * as numbers from "../../../../kit/numbers.js";
import { CohortBaseline } from "./cohort-baseline.js";

/** One step of the cohort baseline calculation. */
export interface CohortBaselineStep {
  describe(): string;
  adjust(item: CohortBaseline, value: number): number;
}

export class CapCohortBaselineAdjuster implements CohortBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCohortBaselineAdjuster implements CohortBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCohortBaselineAdjuster implements CohortBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the cohort baseline steps in order and keeps a trace of each. */
export class CohortBaselineEngine {
  steps: CohortBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CohortBaseline): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CohortBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCohortBaselineEngine(): CohortBaselineEngine {
  return new CohortBaselineEngine(
    [
      new CapCohortBaselineAdjuster(16972),
      new RoundingCohortBaselineAdjuster(5),
      new TieredCohortBaselineAdjuster([5807, 7138], [1.03, 1.09]),
    ],
    [],
    4.3,
    50103.5,
  );
}
