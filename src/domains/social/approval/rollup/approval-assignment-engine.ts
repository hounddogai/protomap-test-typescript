import * as numbers from "../../../../kit/numbers.js";
import { ApprovalAssignment } from "./approval-assignment.js";

/** One step of the approval assignment calculation. */
export interface ApprovalAssignmentFactor {
  describe(): string;
  adjust(item: ApprovalAssignment, value: number): number;
}

export class ApprovalAssignmentConversionRateOffsetAdjuster implements ApprovalAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: ApprovalAssignment, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class CapApprovalAssignmentAdjuster implements ApprovalAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionApprovalAssignmentAdjuster implements ApprovalAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ApprovalAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredApprovalAssignmentAdjuster implements ApprovalAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the approval assignment steps in order and keeps a trace of each. */
export class ApprovalAssignmentEngine {
  steps: ApprovalAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalAssignment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ApprovalAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalAssignmentEngine(): ApprovalAssignmentEngine {
  return new ApprovalAssignmentEngine(
    [
      new ApprovalAssignmentConversionRateOffsetAdjuster(0.1),
      new CapApprovalAssignmentAdjuster(25331),
      new RegionApprovalAssignmentAdjuster(new Map<string, number>([["retail", 1.09], ["west", 1.17]])),
      new TieredApprovalAssignmentAdjuster([1987, 2169], [1.07, 1.16]),
    ],
    [],
    0.8,
    12717.5,
  );
}
