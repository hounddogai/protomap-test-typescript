import * as numbers from "../../../../kit/numbers.js";
import { RegionalBranchDigest } from "./regional-branch-digest.js";

/** One step of the regional branch digest calculation. */
export interface RegionalBranchDigestModifier {
  describe(): string;
  adjust(item: RegionalBranchDigest, value: number): number;
}

export class TieredRegionalBranchDigestAdjuster implements RegionalBranchDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalBranchDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalBranchDigestAdjuster implements RegionalBranchDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalBranchDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionalBranchDigestBudgetOffsetAdjuster implements RegionalBranchDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: RegionalBranchDigest, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class ChannelRegionalBranchDigestAdjuster implements RegionalBranchDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RegionalBranchDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRegionalBranchDigestAdjuster implements RegionalBranchDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalBranchDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalBranchDigestAdjuster implements RegionalBranchDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalBranchDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional branch digest steps in order and keeps a trace of each. */
export class RegionalBranchDigestEngine {
  steps: RegionalBranchDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalBranchDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalBranchDigest): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: RegionalBranchDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalBranchDigestEngine(): RegionalBranchDigestEngine {
  return new RegionalBranchDigestEngine(
    [
      new TieredRegionalBranchDigestAdjuster([6899, 8293, 9891], [1.02, 1.03, 1.2]),
      new RoundingRegionalBranchDigestAdjuster(0.5),
      new RegionalBranchDigestBudgetOffsetAdjuster(0.22),
      new ChannelRegionalBranchDigestAdjuster(new Map<string, number>([["online", 1.14]])),
      new MinimumRegionalBranchDigestAdjuster(47.1),
      new CapRegionalBranchDigestAdjuster(15885),
    ],
    [],
    0.4,
    68502.9,
  );
}
