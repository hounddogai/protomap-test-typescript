import * as numbers from "../../../../kit/numbers.js";
import { RegionalStreakSnapshot } from "./regional-streak-snapshot.js";

/** One step of the regional streak snapshot calculation. */
export interface RegionalStreakSnapshotFactor {
  describe(): string;
  adjust(item: RegionalStreakSnapshot, value: number): number;
}

export class MinimumRegionalStreakSnapshotAdjuster implements RegionalStreakSnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalStreakSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRegionalStreakSnapshotAdjuster implements RegionalStreakSnapshotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalStreakSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalStreakSnapshotAdjuster implements RegionalStreakSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalStreakSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional streak snapshot steps in order and keeps a trace of each. */
export class RegionalStreakSnapshotEngine {
  steps: RegionalStreakSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalStreakSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalStreakSnapshot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RegionalStreakSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalStreakSnapshotEngine(): RegionalStreakSnapshotEngine {
  return new RegionalStreakSnapshotEngine(
    [
      new MinimumRegionalStreakSnapshotAdjuster(46.4),
      new RoundingRegionalStreakSnapshotAdjuster(0.25),
      new PercentRegionalStreakSnapshotAdjuster(-13.2),
    ],
    [],
    2.5,
    51174.2,
  );
}
