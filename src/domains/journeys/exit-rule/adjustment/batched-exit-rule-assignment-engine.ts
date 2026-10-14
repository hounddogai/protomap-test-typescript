import * as numbers from "../../../../kit/numbers.js";
import { BatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

/** One step of the batched exit rule assignment calculation. */
export interface BatchedExitRuleAssignmentModifier {
  describe(): string;
  adjust(item: BatchedExitRuleAssignment, value: number): number;
}

export class CapBatchedExitRuleAssignmentAdjuster implements BatchedExitRuleAssignmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedExitRuleAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelBatchedExitRuleAssignmentAdjuster implements BatchedExitRuleAssignmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BatchedExitRuleAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedExitRuleAssignmentAdjuster implements BatchedExitRuleAssignmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedExitRuleAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched exit rule assignment steps in order and keeps a trace of each. */
export class BatchedExitRuleAssignmentEngine {
  steps: BatchedExitRuleAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedExitRuleAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedExitRuleAssignment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedExitRuleAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedExitRuleAssignmentEngine(): BatchedExitRuleAssignmentEngine {
  return new BatchedExitRuleAssignmentEngine(
    [
      new CapBatchedExitRuleAssignmentAdjuster(31779),
      new ChannelBatchedExitRuleAssignmentAdjuster(
        new Map<string, number>([["north", 0.92], ["central", 1.31], ["west", 0.78]]),
      ),
      new PercentBatchedExitRuleAssignmentAdjuster(21.2),
    ],
    [],
    1.8,
    91778.2,
  );
}
