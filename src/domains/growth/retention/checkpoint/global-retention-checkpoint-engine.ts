import * as flags from "../../../../kit/flags.js";
import { GlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

/** One step of the global retention checkpoint calculation. */
export interface GlobalRetentionCheckpointFactor {
  describe(): string;
  adjust(item: GlobalRetentionCheckpoint, value: number): number;
}

export class FlaggedGlobalRetentionCheckpointAdjuster implements GlobalRetentionCheckpointFactor {
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

  adjust(item: GlobalRetentionCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class GlobalRetentionCheckpointPriorityOffsetAdjuster implements GlobalRetentionCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: GlobalRetentionCheckpoint, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class UnitGlobalRetentionCheckpointAdjuster implements GlobalRetentionCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: GlobalRetentionCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentGlobalRetentionCheckpointAdjuster implements GlobalRetentionCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRetentionCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalRetentionCheckpointAdjuster implements GlobalRetentionCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRetentionCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global retention checkpoint steps in order and keeps a trace of each. */
export class GlobalRetentionCheckpointEngine {
  steps: GlobalRetentionCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRetentionCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalRetentionCheckpoint): number {
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

  evaluateAll(items: GlobalRetentionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalRetentionCheckpointEngine(flagsValue: flags.Registry): GlobalRetentionCheckpointEngine {
  return new GlobalRetentionCheckpointEngine(
    [
      new FlaggedGlobalRetentionCheckpointAdjuster(flagsValue, "global-retention-checkpoint-strict", -3.4),
      new GlobalRetentionCheckpointPriorityOffsetAdjuster(1.95),
      new UnitGlobalRetentionCheckpointAdjuster(new Map<string, number>([["north", 1.12], ["south", 0.87]])),
      new PercentGlobalRetentionCheckpointAdjuster(-12.4),
      new MinimumGlobalRetentionCheckpointAdjuster(0.5),
    ],
    [],
    2.8,
    77348.2,
  );
}
