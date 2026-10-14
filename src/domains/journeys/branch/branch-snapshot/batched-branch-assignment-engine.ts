import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedBranchAssignment } from "./batched-branch-assignment.js";

/** One step of the batched branch assignment calculation. */
export interface BatchedBranchAssignmentAdjuster {
  describe(): string;
  adjust(item: BatchedBranchAssignment, value: number): number;
}

export class FlaggedBatchedBranchAssignmentAdjuster implements BatchedBranchAssignmentAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedBranchAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedBranchAssignmentAdjuster implements BatchedBranchAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedBranchAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedBranchAssignmentAdjuster implements BatchedBranchAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedBranchAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BatchedBranchAssignmentGraceDaysOffsetAdjuster implements BatchedBranchAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: BatchedBranchAssignment, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class RoundingBatchedBranchAssignmentAdjuster implements BatchedBranchAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedBranchAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched branch assignment steps in order and keeps a trace of each. */
export class BatchedBranchAssignmentEngine {
  steps: BatchedBranchAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedBranchAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedBranchAssignment): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: BatchedBranchAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedBranchAssignmentEngine(flagsValue: flags.Registry): BatchedBranchAssignmentEngine {
  return new BatchedBranchAssignmentEngine(
    [
      new FlaggedBatchedBranchAssignmentAdjuster(flagsValue, "batched-branch-assignment-weighted", 0.7),
      new PercentBatchedBranchAssignmentAdjuster(20.2),
      new MinimumBatchedBranchAssignmentAdjuster(41.4),
      new BatchedBranchAssignmentGraceDaysOffsetAdjuster(0.64),
      new RoundingBatchedBranchAssignmentAdjuster(0.05),
    ],
    [],
    0.7,
    57632.6,
  );
}
