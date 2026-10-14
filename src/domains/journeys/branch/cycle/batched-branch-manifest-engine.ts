import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedBranchManifest } from "./batched-branch-manifest.js";

/** One step of the batched branch manifest calculation. */
export interface BatchedBranchManifestAdjuster {
  describe(): string;
  adjust(item: BatchedBranchManifest, value: number): number;
}

export class MinimumBatchedBranchManifestAdjuster implements BatchedBranchManifestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedBranchManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitBatchedBranchManifestAdjuster implements BatchedBranchManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BatchedBranchManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedBranchManifestSequenceOffsetAdjuster implements BatchedBranchManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: BatchedBranchManifest, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class FlaggedBatchedBranchManifestAdjuster implements BatchedBranchManifestAdjuster {
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

  adjust(item: BatchedBranchManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched branch manifest steps in order and keeps a trace of each. */
export class BatchedBranchManifestEngine {
  steps: BatchedBranchManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedBranchManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedBranchManifest): number {
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

  evaluateAll(items: BatchedBranchManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedBranchManifestEngine(flagsValue: flags.Registry): BatchedBranchManifestEngine {
  return new BatchedBranchManifestEngine(
    [
      new MinimumBatchedBranchManifestAdjuster(7.2),
      new UnitBatchedBranchManifestAdjuster(new Map<string, number>([["north", 0.77], ["east", 1.08]])),
      new BatchedBranchManifestSequenceOffsetAdjuster(0.17),
      new FlaggedBatchedBranchManifestAdjuster(flagsValue, "batched-branch-manifest-fallback", -8.2),
    ],
    [],
    0.9,
    82265.1,
  );
}
