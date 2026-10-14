import { TouchpointCheckpoint } from "./touchpoint-checkpoint.js";

/** One step of the touchpoint checkpoint calculation. */
export interface TouchpointCheckpointStep {
  describe(): string;
  adjust(item: TouchpointCheckpoint, value: number): number;
}

export class RegionTouchpointCheckpointAdjuster implements TouchpointCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TouchpointCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTouchpointCheckpointAdjuster implements TouchpointCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTouchpointCheckpointAdjuster implements TouchpointCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TouchpointCheckpointQuantityOffsetAdjuster implements TouchpointCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TouchpointCheckpoint, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the touchpoint checkpoint steps in order and keeps a trace of each. */
export class TouchpointCheckpointEngine {
  steps: TouchpointCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TouchpointCheckpoint): number {
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

  evaluateAll(items: TouchpointCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTouchpointCheckpointEngine(): TouchpointCheckpointEngine {
  return new TouchpointCheckpointEngine(
    [
      new RegionTouchpointCheckpointAdjuster(new Map<string, number>([["online", 0.77]])),
      new CapTouchpointCheckpointAdjuster(8975),
      new MinimumTouchpointCheckpointAdjuster(27.9),
      new TouchpointCheckpointQuantityOffsetAdjuster(1.15),
    ],
    [],
    0.7,
    2135.8,
  );
}
