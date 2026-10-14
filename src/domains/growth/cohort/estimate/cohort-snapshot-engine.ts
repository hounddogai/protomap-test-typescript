import * as flags from "../../../../kit/flags.js";
import { CohortSnapshot } from "./cohort-snapshot.js";

/** One step of the cohort snapshot calculation. */
export interface CohortSnapshotAdjuster {
  describe(): string;
  adjust(item: CohortSnapshot, value: number): number;
}

export class CapCohortSnapshotAdjuster implements CohortSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCohortSnapshotAdjuster implements CohortSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCohortSnapshotAdjuster implements CohortSnapshotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCohortSnapshotAdjuster implements CohortSnapshotAdjuster {
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

  adjust(item: CohortSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CohortSnapshotThresholdOffsetAdjuster implements CohortSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CohortSnapshot, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class TieredCohortSnapshotAdjuster implements CohortSnapshotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the cohort snapshot steps in order and keeps a trace of each. */
export class CohortSnapshotEngine {
  steps: CohortSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CohortSnapshot): number {
    let current = item.netLoad();
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

  evaluateAll(items: CohortSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCohortSnapshotEngine(flagsValue: flags.Registry): CohortSnapshotEngine {
  return new CohortSnapshotEngine(
    [
      new CapCohortSnapshotAdjuster(15238),
      new PercentCohortSnapshotAdjuster(-7.7),
      new MinimumCohortSnapshotAdjuster(3.4),
      new FlaggedCohortSnapshotAdjuster(flagsValue, "cohort-snapshot-tiered", -1.4),
      new CohortSnapshotThresholdOffsetAdjuster(1.11),
      new TieredCohortSnapshotAdjuster([860, 8820], [0.94, 0.89]),
    ],
    [],
    2.6,
    28529.1,
  );
}
