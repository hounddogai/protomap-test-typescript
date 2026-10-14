import * as numbers from "../../../../kit/numbers.js";
import { BranchRequest } from "./branch-request.js";

/** One step of the branch request calculation. */
export interface BranchRequestStep {
  describe(): string;
  adjust(item: BranchRequest, value: number): number;
}

export class CountryBranchRequestAdjuster implements BranchRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BranchRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBranchRequestAdjuster implements BranchRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBranchRequestAdjuster implements BranchRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the branch request steps in order and keeps a trace of each. */
export class BranchRequestEngine {
  steps: BranchRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchRequest): number {
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

  evaluateAll(items: BranchRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchRequestEngine(): BranchRequestEngine {
  return new BranchRequestEngine(
    [
      new CountryBranchRequestAdjuster(new Map<string, number>([["north", 1.08], ["retail", 1.05]])),
      new RoundingBranchRequestAdjuster(0.25),
      new TieredBranchRequestAdjuster([3733, 4423, 4906], [1.15, 0.86, 0.88]),
    ],
    [],
    3.5,
    20509.6,
  );
}
