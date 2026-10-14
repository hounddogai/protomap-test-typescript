import { LevelAllocation } from "./level-allocation.js";

/** One step of the level allocation calculation. */
export interface LevelAllocationStep {
  describe(): string;
  adjust(item: LevelAllocation, value: number): number;
}

export class RegionLevelAllocationAdjuster implements LevelAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LevelAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLevelAllocationAdjuster implements LevelAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LevelAllocationCreatedAtOffsetAdjuster implements LevelAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: LevelAllocation, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the level allocation steps in order and keeps a trace of each. */
export class LevelAllocationEngine {
  steps: LevelAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelAllocation): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: LevelAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelAllocationEngine(): LevelAllocationEngine {
  return new LevelAllocationEngine(
    [
      new RegionLevelAllocationAdjuster(
        new Map<string, number>([["west", 0.95], ["south", 0.78], ["retail", 1.19]]),
      ),
      new PercentLevelAllocationAdjuster(11.6),
      new LevelAllocationCreatedAtOffsetAdjuster(0.66),
    ],
    [],
    3.4,
    31807.9,
  );
}
