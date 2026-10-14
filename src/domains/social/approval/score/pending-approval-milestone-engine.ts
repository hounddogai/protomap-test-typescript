import * as numbers from "../../../../kit/numbers.js";
import { PendingApprovalMilestone } from "./pending-approval-milestone.js";

/** One step of the pending approval milestone calculation. */
export interface PendingApprovalMilestoneAdjuster {
  describe(): string;
  adjust(item: PendingApprovalMilestone, value: number): number;
}

export class PendingApprovalMilestoneBudgetOffsetAdjuster implements PendingApprovalMilestoneAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PendingApprovalMilestone, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class UtmSourcePendingApprovalMilestoneAdjuster implements PendingApprovalMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PendingApprovalMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPendingApprovalMilestoneAdjuster implements PendingApprovalMilestoneAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingApprovalMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPendingApprovalMilestoneAdjuster implements PendingApprovalMilestoneAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingApprovalMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPendingApprovalMilestoneAdjuster implements PendingApprovalMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingApprovalMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingApprovalMilestoneAdjuster implements PendingApprovalMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingApprovalMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending approval milestone steps in order and keeps a trace of each. */
export class PendingApprovalMilestoneEngine {
  steps: PendingApprovalMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingApprovalMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingApprovalMilestone): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PendingApprovalMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingApprovalMilestoneEngine(): PendingApprovalMilestoneEngine {
  return new PendingApprovalMilestoneEngine(
    [
      new PendingApprovalMilestoneBudgetOffsetAdjuster(1.7),
      new UtmSourcePendingApprovalMilestoneAdjuster(new Map<string, number>([["south", 1.13]])),
      new RoundingPendingApprovalMilestoneAdjuster(5),
      new TieredPendingApprovalMilestoneAdjuster([766, 4971, 5622, 9888], [0.99, 1.03, 1.12, 1.07]),
      new PercentPendingApprovalMilestoneAdjuster(-6.9),
      new CapPendingApprovalMilestoneAdjuster(15517),
    ],
    [],
    3.2,
    64991.6,
  );
}
