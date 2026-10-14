import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedBranchTemplate } from "./batched-branch-template.js";

/** One step of the batched branch template calculation. */
export interface BatchedBranchTemplateModifier {
  describe(): string;
  adjust(item: BatchedBranchTemplate, value: number): number;
}

export class MinimumBatchedBranchTemplateAdjuster implements BatchedBranchTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedBranchTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedBranchTemplateAdjuster implements BatchedBranchTemplateModifier {
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

  adjust(item: BatchedBranchTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedBranchTemplateAdjuster implements BatchedBranchTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedBranchTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedBranchTemplateAdjuster implements BatchedBranchTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedBranchTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedBranchTemplateAdjuster implements BatchedBranchTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedBranchTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched branch template steps in order and keeps a trace of each. */
export class BatchedBranchTemplateEngine {
  steps: BatchedBranchTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedBranchTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedBranchTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedBranchTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedBranchTemplateEngine(flagsValue: flags.Registry): BatchedBranchTemplateEngine {
  return new BatchedBranchTemplateEngine(
    [
      new MinimumBatchedBranchTemplateAdjuster(24.6),
      new FlaggedBatchedBranchTemplateAdjuster(flagsValue, "batched-branch-template-fallback", -8.5),
      new PercentBatchedBranchTemplateAdjuster(18.4),
      new RoundingBatchedBranchTemplateAdjuster(0.5),
      new CapBatchedBranchTemplateAdjuster(41491),
    ],
    [],
    3.6,
    97853.5,
  );
}
