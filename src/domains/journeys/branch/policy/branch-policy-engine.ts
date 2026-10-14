import * as numbers from "../../../../kit/numbers.js";
import { BranchPolicy } from "./branch-policy.js";

/** One step of the branch policy calculation. */
export interface BranchPolicyStep {
  describe(): string;
  adjust(item: BranchPolicy, value: number): number;
}

export class TieredBranchPolicyAdjuster implements BranchPolicyStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBranchPolicyAdjuster implements BranchPolicyStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBranchPolicyAdjuster implements BranchPolicyStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameBranchPolicyAdjuster implements BranchPolicyStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BranchPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BranchPolicyOpenRateOffsetAdjuster implements BranchPolicyStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: BranchPolicy, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class RoundingBranchPolicyAdjuster implements BranchPolicyStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the branch policy steps in order and keeps a trace of each. */
export class BranchPolicyEngine {
  steps: BranchPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchPolicy): number {
    let current = item.netLoad();
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

  evaluateAll(items: BranchPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchPolicyEngine(): BranchPolicyEngine {
  return new BranchPolicyEngine(
    [
      new TieredBranchPolicyAdjuster([6085, 6106, 8506, 9604], [0.84, 0.84, 0.85, 0.9]),
      new MinimumBranchPolicyAdjuster(34),
      new CapBranchPolicyAdjuster(43100),
      new NameBranchPolicyAdjuster(new Map<string, number>([["retail", 1.11]])),
      new BranchPolicyOpenRateOffsetAdjuster(1.58),
      new RoundingBranchPolicyAdjuster(0.5),
    ],
    [],
    4.8,
    92250.7,
  );
}
