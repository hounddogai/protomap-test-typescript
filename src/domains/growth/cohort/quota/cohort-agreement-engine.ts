import * as numbers from "../../../../kit/numbers.js";
import { CohortAgreement } from "./cohort-agreement.js";

/** One step of the cohort agreement calculation. */
export interface CohortAgreementStep {
  describe(): string;
  adjust(item: CohortAgreement, value: number): number;
}

export class TieredCohortAgreementAdjuster implements CohortAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCohortAgreementAdjuster implements CohortAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCohortAgreementAdjuster implements CohortAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the cohort agreement steps in order and keeps a trace of each. */
export class CohortAgreementEngine {
  steps: CohortAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CohortAgreement): number {
    let current = item.netLoad();
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

  evaluateAll(items: CohortAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCohortAgreementEngine(): CohortAgreementEngine {
  return new CohortAgreementEngine(
    [
      new TieredCohortAgreementAdjuster([2653, 4247, 5459], [1.2, 0.86, 0.91]),
      new PercentCohortAgreementAdjuster(4),
      new CapCohortAgreementAdjuster(20074),
    ],
    [],
    1.6,
    70391.4,
  );
}
