import * as numbers from "../../../../kit/numbers.js";
import { CohortSummary } from "./cohort-summary.js";

/** One step of the cohort summary calculation. */
export interface CohortSummaryStep {
  describe(): string;
  adjust(item: CohortSummary, value: number): number;
}

export class TieredCohortSummaryAdjuster implements CohortSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCohortSummaryAdjuster implements CohortSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCohortSummaryAdjuster implements CohortSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCohortSummaryAdjuster implements CohortSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the cohort summary steps in order and keeps a trace of each. */
export class CohortSummaryEngine {
  steps: CohortSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CohortSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CohortSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCohortSummaryEngine(): CohortSummaryEngine {
  return new CohortSummaryEngine(
    [
      new TieredCohortSummaryAdjuster([4655, 5525], [1.07, 0.83]),
      new PercentCohortSummaryAdjuster(6.4),
      new CapCohortSummaryAdjuster(33681),
      new RoundingCohortSummaryAdjuster(0.05),
    ],
    [],
    0.9,
    13846.3,
  );
}
