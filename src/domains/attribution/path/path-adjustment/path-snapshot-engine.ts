import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathSnapshot } from "./path-snapshot.js";

/** One step of the path snapshot calculation. */
export interface PathSnapshotFactor {
  describe(): string;
  adjust(item: PathSnapshot, value: number): number;
}

export class MinimumPathSnapshotAdjuster implements PathSnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPathSnapshotAdjuster implements PathSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPathSnapshotAdjuster implements PathSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPathSnapshotAdjuster implements PathSnapshotFactor {
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

  adjust(item: PathSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path snapshot steps in order and keeps a trace of each. */
export class PathSnapshotEngine {
  steps: PathSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathSnapshot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PathSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathSnapshotEngine(flagsValue: flags.Registry): PathSnapshotEngine {
  return new PathSnapshotEngine(
    [
      new MinimumPathSnapshotAdjuster(7.3),
      new PercentPathSnapshotAdjuster(9.3),
      new CapPathSnapshotAdjuster(30708),
      new FlaggedPathSnapshotAdjuster(flagsValue, "path-snapshot-tiered", -0.6),
    ],
    [],
    1.7,
    4926,
  );
}
