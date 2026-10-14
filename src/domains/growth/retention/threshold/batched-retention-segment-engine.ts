import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedRetentionSegment } from "./batched-retention-segment.js";

/** One step of the batched retention segment calculation. */
export interface BatchedRetentionSegmentModifier {
  describe(): string;
  adjust(item: BatchedRetentionSegment, value: number): number;
}

export class FlaggedBatchedRetentionSegmentAdjuster implements BatchedRetentionSegmentModifier {
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

  adjust(item: BatchedRetentionSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedRetentionSegmentVersionOffsetAdjuster implements BatchedRetentionSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: BatchedRetentionSegment, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingBatchedRetentionSegmentAdjuster implements BatchedRetentionSegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedRetentionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedRetentionSegmentAdjuster implements BatchedRetentionSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedRetentionSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBatchedRetentionSegmentAdjuster implements BatchedRetentionSegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedRetentionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched retention segment steps in order and keeps a trace of each. */
export class BatchedRetentionSegmentEngine {
  steps: BatchedRetentionSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedRetentionSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedRetentionSegment): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: BatchedRetentionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedRetentionSegmentEngine(flagsValue: flags.Registry): BatchedRetentionSegmentEngine {
  return new BatchedRetentionSegmentEngine(
    [
      new FlaggedBatchedRetentionSegmentAdjuster(flagsValue, "batched-retention-segment-weighted", 0.1),
      new BatchedRetentionSegmentVersionOffsetAdjuster(0.43),
      new RoundingBatchedRetentionSegmentAdjuster(5),
      new MinimumBatchedRetentionSegmentAdjuster(38.2),
      new PercentBatchedRetentionSegmentAdjuster(-8.8),
    ],
    [],
    3.5,
    85559.5,
  );
}
