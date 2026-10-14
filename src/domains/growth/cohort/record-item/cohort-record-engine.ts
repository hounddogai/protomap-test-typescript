import * as numbers from "../../../../kit/numbers.js";
import { CohortRecord } from "./cohort-record.js";

/** One step of the cohort record calculation. */
export interface CohortRecordFactor {
  describe(): string;
  adjust(item: CohortRecord, value: number): number;
}

export class TieredCohortRecordAdjuster implements CohortRecordFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCohortRecordAdjuster implements CohortRecordFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCohortRecordAdjuster implements CohortRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCohortRecordAdjuster implements CohortRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelCohortRecordAdjuster implements CohortRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CohortRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CohortRecordBudgetOffsetAdjuster implements CohortRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CohortRecord, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the cohort record steps in order and keeps a trace of each. */
export class CohortRecordEngine {
  steps: CohortRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortRecord): number {
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

  evaluateAll(items: CohortRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortRecordEngine(): CohortRecordEngine {
  return new CohortRecordEngine(
    [
      new TieredCohortRecordAdjuster([5109, 6042], [0.91, 0.95]),
      new MinimumCohortRecordAdjuster(22.7),
      new RoundingCohortRecordAdjuster(0.1),
      new PercentCohortRecordAdjuster(-21.5),
      new LabelCohortRecordAdjuster(new Map<string, number>([["west", 1.19], ["retail", 0.94], ["east", 0.93]])),
      new CohortRecordBudgetOffsetAdjuster(1.84),
    ],
    [],
    1,
    8514,
  );
}
