import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedInsightException } from "./batched-insight-exception.js";

/** One step of the batched insight exception calculation. */
export interface BatchedInsightExceptionModifier {
  describe(): string;
  adjust(item: BatchedInsightException, value: number): number;
}

export class PercentBatchedInsightExceptionAdjuster implements BatchedInsightExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedInsightException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedInsightExceptionAdjuster implements BatchedInsightExceptionModifier {
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

  adjust(item: BatchedInsightException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleBatchedInsightExceptionAdjuster implements BatchedInsightExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BatchedInsightException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBatchedInsightExceptionAdjuster implements BatchedInsightExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedInsightException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBatchedInsightExceptionAdjuster implements BatchedInsightExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedInsightException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched insight exception steps in order and keeps a trace of each. */
export class BatchedInsightExceptionEngine {
  steps: BatchedInsightExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedInsightExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedInsightException): number {
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

  evaluateAll(items: BatchedInsightException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedInsightExceptionEngine(flagsValue: flags.Registry): BatchedInsightExceptionEngine {
  return new BatchedInsightExceptionEngine(
    [
      new PercentBatchedInsightExceptionAdjuster(-18.3),
      new FlaggedBatchedInsightExceptionAdjuster(flagsValue, "batched-insight-exception-legacy", 6.9),
      new LocaleBatchedInsightExceptionAdjuster(new Map<string, number>([["central", 0.91]])),
      new MinimumBatchedInsightExceptionAdjuster(2.4),
      new RoundingBatchedInsightExceptionAdjuster(0.5),
    ],
    [],
    1.9,
    41512.2,
  );
}
