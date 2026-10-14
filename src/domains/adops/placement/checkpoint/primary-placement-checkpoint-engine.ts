import { PrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

/** One step of the primary placement checkpoint calculation. */
export interface PrimaryPlacementCheckpointAdjuster {
  describe(): string;
  adjust(item: PrimaryPlacementCheckpoint, value: number): number;
}

export class PrimaryPlacementCheckpointAttemptsOffsetAdjuster implements PrimaryPlacementCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: PrimaryPlacementCheckpoint, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class PercentPrimaryPlacementCheckpointAdjuster implements PrimaryPlacementCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPlacementCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimaryPlacementCheckpointAdjuster implements PrimaryPlacementCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPlacementCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary placement checkpoint steps in order and keeps a trace of each. */
export class PrimaryPlacementCheckpointEngine {
  steps: PrimaryPlacementCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPlacementCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryPlacementCheckpoint): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PrimaryPlacementCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryPlacementCheckpointEngine(): PrimaryPlacementCheckpointEngine {
  return new PrimaryPlacementCheckpointEngine(
    [
      new PrimaryPlacementCheckpointAttemptsOffsetAdjuster(1.12),
      new PercentPrimaryPlacementCheckpointAdjuster(-6),
      new MinimumPrimaryPlacementCheckpointAdjuster(29.5),
    ],
    [],
    3.1,
    35915.5,
  );
}
