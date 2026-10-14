import * as flags from "../../../../kit/flags.js";
import { RollingInsightSnapshot } from "./rolling-insight-snapshot.js";

/** One step of the rolling insight snapshot calculation. */
export interface RollingInsightSnapshotFactor {
  describe(): string;
  adjust(item: RollingInsightSnapshot, value: number): number;
}

export class FlaggedRollingInsightSnapshotAdjuster implements RollingInsightSnapshotFactor {
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

  adjust(item: RollingInsightSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingInsightSnapshotRatioOffsetAdjuster implements RollingInsightSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: RollingInsightSnapshot, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredRollingInsightSnapshotAdjuster implements RollingInsightSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingInsightSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling insight snapshot steps in order and keeps a trace of each. */
export class RollingInsightSnapshotEngine {
  steps: RollingInsightSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingInsightSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingInsightSnapshot): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RollingInsightSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingInsightSnapshotEngine(flagsValue: flags.Registry): RollingInsightSnapshotEngine {
  return new RollingInsightSnapshotEngine(
    [
      new FlaggedRollingInsightSnapshotAdjuster(flagsValue, "rolling-insight-snapshot-rolling", -8),
      new RollingInsightSnapshotRatioOffsetAdjuster(1.89),
      new TieredRollingInsightSnapshotAdjuster([452, 9290], [0.93, 0.96]),
    ],
    [],
    0.9,
    72479.6,
  );
}
