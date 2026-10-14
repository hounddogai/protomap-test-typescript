import * as numbers from "../../../../kit/numbers.js";
import { WeightedMentionCycle } from "./weighted-mention-cycle.js";

/** One step of the weighted mention cycle calculation. */
export interface WeightedMentionCycleAdjuster {
  describe(): string;
  adjust(item: WeightedMentionCycle, value: number): number;
}

export class CapWeightedMentionCycleAdjuster implements WeightedMentionCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedMentionCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWeightedMentionCycleAdjuster implements WeightedMentionCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedMentionCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedMentionCycleAdjuster implements WeightedMentionCycleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedMentionCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceWeightedMentionCycleAdjuster implements WeightedMentionCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WeightedMentionCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted mention cycle steps in order and keeps a trace of each. */
export class WeightedMentionCycleEngine {
  steps: WeightedMentionCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedMentionCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedMentionCycle): number {
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

  evaluateAll(items: WeightedMentionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedMentionCycleEngine(): WeightedMentionCycleEngine {
  return new WeightedMentionCycleEngine(
    [
      new CapWeightedMentionCycleAdjuster(14697),
      new PercentWeightedMentionCycleAdjuster(12.5),
      new MinimumWeightedMentionCycleAdjuster(20.4),
      new SourceWeightedMentionCycleAdjuster(new Map<string, number>([["east", 1.31]])),
    ],
    [],
    4.8,
    46817.3,
  );
}
