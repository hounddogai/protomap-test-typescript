import { BatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

/** One step of the batched reward rule override calculation. */
export interface BatchedRewardRuleOverrideStep {
  describe(): string;
  adjust(item: BatchedRewardRuleOverride, value: number): number;
}

export class BatchedRewardRuleOverrideRetriesOffsetAdjuster implements BatchedRewardRuleOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: BatchedRewardRuleOverride, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumBatchedRewardRuleOverrideAdjuster implements BatchedRewardRuleOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedRewardRuleOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedRewardRuleOverrideAdjuster implements BatchedRewardRuleOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedRewardRuleOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched reward rule override steps in order and keeps a trace of each. */
export class BatchedRewardRuleOverrideEngine {
  steps: BatchedRewardRuleOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedRewardRuleOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedRewardRuleOverride): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BatchedRewardRuleOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedRewardRuleOverrideEngine(): BatchedRewardRuleOverrideEngine {
  return new BatchedRewardRuleOverrideEngine(
    [
      new BatchedRewardRuleOverrideRetriesOffsetAdjuster(1.05),
      new MinimumBatchedRewardRuleOverrideAdjuster(34.3),
      new CapBatchedRewardRuleOverrideAdjuster(49639),
    ],
    [],
    0.6,
    98772.8,
  );
}
