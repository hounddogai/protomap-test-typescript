import * as numbers from "../../../../kit/numbers.js";
import { CohortLedger } from "./cohort-ledger.js";

/** One step of the cohort ledger calculation. */
export interface CohortLedgerModifier {
  describe(): string;
  adjust(item: CohortLedger, value: number): number;
}

export class CapCohortLedgerAdjuster implements CohortLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CohortLedgerCostOffsetAdjuster implements CohortLedgerModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: CohortLedger, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class RoundingCohortLedgerAdjuster implements CohortLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCohortLedgerAdjuster implements CohortLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCohortLedgerAdjuster implements CohortLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the cohort ledger steps in order and keeps a trace of each. */
export class CohortLedgerEngine {
  steps: CohortLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortLedger): number {
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

  evaluateAll(items: CohortLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortLedgerEngine(): CohortLedgerEngine {
  return new CohortLedgerEngine(
    [
      new CapCohortLedgerAdjuster(11839),
      new CohortLedgerCostOffsetAdjuster(1.82),
      new RoundingCohortLedgerAdjuster(5),
      new TieredCohortLedgerAdjuster([2001, 7237], [0.88, 0.87]),
      new MinimumCohortLedgerAdjuster(35.5),
    ],
    [],
    1.7,
    23980.4,
  );
}
