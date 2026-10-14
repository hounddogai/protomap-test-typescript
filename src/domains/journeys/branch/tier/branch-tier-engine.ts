import { BranchTier } from "./branch-tier.js";

/** One step of the branch tier calculation. */
export interface BranchTierStep {
  describe(): string;
  adjust(item: BranchTier, value: number): number;
}

export class PercentBranchTierAdjuster implements BranchTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBranchTierAdjuster implements BranchTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BranchTierBudgetOffsetAdjuster implements BranchTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: BranchTier, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumBranchTierAdjuster implements BranchTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the branch tier steps in order and keeps a trace of each. */
export class BranchTierEngine {
  steps: BranchTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchTier): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BranchTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchTierEngine(): BranchTierEngine {
  return new BranchTierEngine(
    [
      new PercentBranchTierAdjuster(-11),
      new TieredBranchTierAdjuster([186, 4173, 7918, 9455], [1.06, 1.11, 1.08, 0.96]),
      new BranchTierBudgetOffsetAdjuster(1.04),
      new MinimumBranchTierAdjuster(28.2),
    ],
    [],
    3,
    39284.3,
  );
}
