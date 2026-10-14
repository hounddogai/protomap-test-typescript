import * as numbers from "../../../../kit/numbers.js";
import { BranchVariance } from "./branch-variance.js";

/** One step of the branch variance calculation. */
export interface BranchVarianceAdjuster {
  describe(): string;
  adjust(item: BranchVariance, value: number): number;
}

export class RoundingBranchVarianceAdjuster implements BranchVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BranchVarianceDiscountOffsetAdjuster implements BranchVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: BranchVariance, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class MinimumBranchVarianceAdjuster implements BranchVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBranchVarianceAdjuster implements BranchVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelBranchVarianceAdjuster implements BranchVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BranchVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the branch variance steps in order and keeps a trace of each. */
export class BranchVarianceEngine {
  steps: BranchVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BranchVariance): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BranchVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBranchVarianceEngine(): BranchVarianceEngine {
  return new BranchVarianceEngine(
    [
      new RoundingBranchVarianceAdjuster(1),
      new BranchVarianceDiscountOffsetAdjuster(0.65),
      new MinimumBranchVarianceAdjuster(39.4),
      new CapBranchVarianceAdjuster(28645),
      new LabelBranchVarianceAdjuster(new Map<string, number>([["central", 0.77], ["south", 1.35]])),
    ],
    [],
    2.1,
    29747.5,
  );
}
