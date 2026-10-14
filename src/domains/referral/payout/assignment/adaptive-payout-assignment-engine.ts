import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

/** One step of the adaptive payout assignment calculation. */
export interface AdaptivePayoutAssignmentFactor {
  describe(): string;
  adjust(item: AdaptivePayoutAssignment, value: number): number;
}

export class CapAdaptivePayoutAssignmentAdjuster implements AdaptivePayoutAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptivePayoutAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptivePayoutAssignmentAdjuster implements AdaptivePayoutAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePayoutAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class AdaptivePayoutAssignmentBudgetOffsetAdjuster implements AdaptivePayoutAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: AdaptivePayoutAssignment, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the adaptive payout assignment steps in order and keeps a trace of each. */
export class AdaptivePayoutAssignmentEngine {
  steps: AdaptivePayoutAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePayoutAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptivePayoutAssignment): number {
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

  evaluateAll(items: AdaptivePayoutAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptivePayoutAssignmentEngine(): AdaptivePayoutAssignmentEngine {
  return new AdaptivePayoutAssignmentEngine(
    [
      new CapAdaptivePayoutAssignmentAdjuster(33876),
      new PercentAdaptivePayoutAssignmentAdjuster(2.3),
      new AdaptivePayoutAssignmentBudgetOffsetAdjuster(0.11),
    ],
    [],
    1.2,
    75900.6,
  );
}
