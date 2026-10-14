import * as numbers from "../../../../kit/numbers.js";
import { CohortProposal } from "./cohort-proposal.js";

/** One step of the cohort proposal calculation. */
export interface CohortProposalFactor {
  describe(): string;
  adjust(item: CohortProposal, value: number): number;
}

export class TieredCohortProposalAdjuster implements CohortProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCohortProposalAdjuster implements CohortProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCohortProposalAdjuster implements CohortProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryCohortProposalAdjuster implements CohortProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: CohortProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCohortProposalAdjuster implements CohortProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the cohort proposal steps in order and keeps a trace of each. */
export class CohortProposalEngine {
  steps: CohortProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortProposal): number {
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

  evaluateAll(items: CohortProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortProposalEngine(): CohortProposalEngine {
  return new CohortProposalEngine(
    [
      new TieredCohortProposalAdjuster([3559, 3657, 8152], [1.14, 1.18, 1.2]),
      new RoundingCohortProposalAdjuster(0.25),
      new MinimumCohortProposalAdjuster(26.7),
      new CountryCohortProposalAdjuster(new Map<string, number>([["online", 0.86], ["central", 1.16]])),
      new PercentCohortProposalAdjuster(2.7),
    ],
    [],
    0.2,
    84283.5,
  );
}
