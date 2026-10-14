import * as numbers from "../../../../kit/numbers.js";
import { BranchTarget } from "./branch-target.js";

/** One step of the branch target calculation. */
export interface BranchTargetStep {
  describe(): string;
  adjust(item: BranchTarget, value: number): number;
}

export class BranchTargetBidOffsetAdjuster implements BranchTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: BranchTarget, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RegionBranchTargetAdjuster implements BranchTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BranchTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBranchTargetAdjuster implements BranchTargetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the branch target steps in order and keeps a trace of each. */
export class BranchTargetEngine {
  steps: BranchTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchTarget): number {
    let current = item.netVolume();
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

  evaluateAll(items: BranchTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchTargetEngine(): BranchTargetEngine {
  return new BranchTargetEngine(
    [
      new BranchTargetBidOffsetAdjuster(1.81),
      new RegionBranchTargetAdjuster(new Map<string, number>([["south", 0.88], ["central", 1.22]])),
      new TieredBranchTargetAdjuster([4264, 7362], [0.94, 1.11]),
    ],
    [],
    0.2,
    62519,
  );
}
