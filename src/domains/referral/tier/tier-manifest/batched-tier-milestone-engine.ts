import * as numbers from "../../../../kit/numbers.js";
import { BatchedTierMilestone } from "./batched-tier-milestone.js";

/** One step of the batched tier milestone calculation. */
export interface BatchedTierMilestoneModifier {
  describe(): string;
  adjust(item: BatchedTierMilestone, value: number): number;
}

export class TitleBatchedTierMilestoneAdjuster implements BatchedTierMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedTierMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedTierMilestoneUpdatedAtOffsetAdjuster implements BatchedTierMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: BatchedTierMilestone, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class RoundingBatchedTierMilestoneAdjuster implements BatchedTierMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedTierMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBatchedTierMilestoneAdjuster implements BatchedTierMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedTierMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched tier milestone steps in order and keeps a trace of each. */
export class BatchedTierMilestoneEngine {
  steps: BatchedTierMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedTierMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedTierMilestone): number {
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

  evaluateAll(items: BatchedTierMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedTierMilestoneEngine(): BatchedTierMilestoneEngine {
  return new BatchedTierMilestoneEngine(
    [
      new TitleBatchedTierMilestoneAdjuster(
        new Map<string, number>([["north", 1.12], ["east", 0.87], ["central", 1.15]]),
      ),
      new BatchedTierMilestoneUpdatedAtOffsetAdjuster(1.75),
      new RoundingBatchedTierMilestoneAdjuster(0.1),
      new CapBatchedTierMilestoneAdjuster(6871),
    ],
    [],
    4.8,
    56657.1,
  );
}
