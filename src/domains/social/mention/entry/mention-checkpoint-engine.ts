import * as numbers from "../../../../kit/numbers.js";
import { MentionCheckpoint } from "./mention-checkpoint.js";

/** One step of the mention checkpoint calculation. */
export interface MentionCheckpointStep {
  describe(): string;
  adjust(item: MentionCheckpoint, value: number): number;
}

export class UnitMentionCheckpointAdjuster implements MentionCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: MentionCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MentionCheckpointBudgetOffsetAdjuster implements MentionCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: MentionCheckpoint, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredMentionCheckpointAdjuster implements MentionCheckpointStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumMentionCheckpointAdjuster implements MentionCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the mention checkpoint steps in order and keeps a trace of each. */
export class MentionCheckpointEngine {
  steps: MentionCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionCheckpoint): number {
    let current = item.netExposure();
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

  evaluateAll(items: MentionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionCheckpointEngine(): MentionCheckpointEngine {
  return new MentionCheckpointEngine(
    [
      new UnitMentionCheckpointAdjuster(new Map<string, number>([["south", 0.7]])),
      new MentionCheckpointBudgetOffsetAdjuster(0.71),
      new TieredMentionCheckpointAdjuster([869, 2773], [0.84, 1.17]),
      new MinimumMentionCheckpointAdjuster(21.4),
    ],
    [],
    4.8,
    81781.6,
  );
}
