import * as numbers from "../../../../kit/numbers.js";
import { LevelSnapshot } from "./level-snapshot.js";

/** One step of the level snapshot calculation. */
export interface LevelSnapshotFactor {
  describe(): string;
  adjust(item: LevelSnapshot, value: number): number;
}

export class PercentLevelSnapshotAdjuster implements LevelSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLevelSnapshotAdjuster implements LevelSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLevelSnapshotAdjuster implements LevelSnapshotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLevelSnapshotAdjuster implements LevelSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the level snapshot steps in order and keeps a trace of each. */
export class LevelSnapshotEngine {
  steps: LevelSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelSnapshot): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LevelSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelSnapshotEngine(): LevelSnapshotEngine {
  return new LevelSnapshotEngine(
    [
      new PercentLevelSnapshotAdjuster(-13.5),
      new CapLevelSnapshotAdjuster(1394),
      new RoundingLevelSnapshotAdjuster(0.25),
      new TieredLevelSnapshotAdjuster([2358, 2611, 3092, 8525], [0.92, 1.14, 1.16, 0.85]),
    ],
    [],
    2.2,
    61276.2,
  );
}
