import * as numbers from "../../../../kit/numbers.js";
import { ApprovalRollup } from "./approval-rollup.js";

/** One step of the approval rollup calculation. */
export interface ApprovalRollupModifier {
  describe(): string;
  adjust(item: ApprovalRollup, value: number): number;
}

export class LabelApprovalRollupAdjuster implements ApprovalRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ApprovalRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingApprovalRollupAdjuster implements ApprovalRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredApprovalRollupAdjuster implements ApprovalRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapApprovalRollupAdjuster implements ApprovalRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ApprovalRollupVersionOffsetAdjuster implements ApprovalRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ApprovalRollup, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the approval rollup steps in order and keeps a trace of each. */
export class ApprovalRollupEngine {
  steps: ApprovalRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalRollup): number {
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

  evaluateAll(items: ApprovalRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalRollupEngine(): ApprovalRollupEngine {
  return new ApprovalRollupEngine(
    [
      new LabelApprovalRollupAdjuster(new Map<string, number>([["west", 1]])),
      new RoundingApprovalRollupAdjuster(0.05),
      new TieredApprovalRollupAdjuster([2587, 2686, 7374, 8952], [1.02, 1.08, 0.93, 1]),
      new CapApprovalRollupAdjuster(26715),
      new ApprovalRollupVersionOffsetAdjuster(1.35),
    ],
    [],
    4.1,
    63267.6,
  );
}
