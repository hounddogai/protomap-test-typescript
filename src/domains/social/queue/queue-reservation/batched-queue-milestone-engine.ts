import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedQueueMilestone } from "./batched-queue-milestone.js";

/** One step of the batched queue milestone calculation. */
export interface BatchedQueueMilestoneModifier {
  describe(): string;
  adjust(item: BatchedQueueMilestone, value: number): number;
}

export class CapBatchedQueueMilestoneAdjuster implements BatchedQueueMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedQueueMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BatchedQueueMilestoneCreatedAtOffsetAdjuster implements BatchedQueueMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: BatchedQueueMilestone, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class MinimumBatchedQueueMilestoneAdjuster implements BatchedQueueMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedQueueMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedQueueMilestoneAdjuster implements BatchedQueueMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedQueueMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedQueueMilestoneAdjuster implements BatchedQueueMilestoneModifier {
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

  adjust(item: BatchedQueueMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched queue milestone steps in order and keeps a trace of each. */
export class BatchedQueueMilestoneEngine {
  steps: BatchedQueueMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedQueueMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedQueueMilestone): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BatchedQueueMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedQueueMilestoneEngine(flagsValue: flags.Registry): BatchedQueueMilestoneEngine {
  return new BatchedQueueMilestoneEngine(
    [
      new CapBatchedQueueMilestoneAdjuster(22896),
      new BatchedQueueMilestoneCreatedAtOffsetAdjuster(0.29),
      new MinimumBatchedQueueMilestoneAdjuster(6),
      new TieredBatchedQueueMilestoneAdjuster([3088, 5413, 8510], [0.93, 1.18, 0.92]),
      new FlaggedBatchedQueueMilestoneAdjuster(flagsValue, "batched-queue-milestone-scheduled", 4.7),
    ],
    [],
    0.2,
    20196.3,
  );
}
