import * as flags from "../../../../kit/flags.js";
import { BatchedOptOutScore } from "./batched-opt-out-score.js";

/** One step of the batched opt out score calculation. */
export interface BatchedOptOutScoreStep {
  describe(): string;
  adjust(item: BatchedOptOutScore, value: number): number;
}

export class MinimumBatchedOptOutScoreAdjuster implements BatchedOptOutScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedOptOutScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedOptOutScoreAdjuster implements BatchedOptOutScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedOptOutScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedOptOutScoreAdjuster implements BatchedOptOutScoreStep {
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

  adjust(item: BatchedOptOutScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched opt out score steps in order and keeps a trace of each. */
export class BatchedOptOutScoreEngine {
  steps: BatchedOptOutScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedOptOutScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedOptOutScore): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: BatchedOptOutScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedOptOutScoreEngine(flagsValue: flags.Registry): BatchedOptOutScoreEngine {
  return new BatchedOptOutScoreEngine(
    [
      new MinimumBatchedOptOutScoreAdjuster(39.7),
      new PercentBatchedOptOutScoreAdjuster(-3.5),
      new FlaggedBatchedOptOutScoreAdjuster(flagsValue, "batched-opt-out-score-capped", 4.1),
    ],
    [],
    4.7,
    91280,
  );
}
