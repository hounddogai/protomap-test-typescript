import * as flags from "../../../../kit/flags.js";
import { LegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

/** One step of the legacy wait checkpoint calculation. */
export interface LegacyWaitCheckpointModifier {
  describe(): string;
  adjust(item: LegacyWaitCheckpoint, value: number): number;
}

export class MinimumLegacyWaitCheckpointAdjuster implements LegacyWaitCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyWaitCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLegacyWaitCheckpointAdjuster implements LegacyWaitCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyWaitCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLegacyWaitCheckpointAdjuster implements LegacyWaitCheckpointModifier {
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

  adjust(item: LegacyWaitCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyWaitCheckpointAdjuster implements LegacyWaitCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyWaitCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyWaitCheckpointCostOffsetAdjuster implements LegacyWaitCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: LegacyWaitCheckpoint, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the legacy wait checkpoint steps in order and keeps a trace of each. */
export class LegacyWaitCheckpointEngine {
  steps: LegacyWaitCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyWaitCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyWaitCheckpoint): number {
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

  evaluateAll(items: LegacyWaitCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyWaitCheckpointEngine(flagsValue: flags.Registry): LegacyWaitCheckpointEngine {
  return new LegacyWaitCheckpointEngine(
    [
      new MinimumLegacyWaitCheckpointAdjuster(17.6),
      new PercentLegacyWaitCheckpointAdjuster(12.6),
      new FlaggedLegacyWaitCheckpointAdjuster(flagsValue, "legacy-wait-checkpoint-strict", 6.2),
      new CapLegacyWaitCheckpointAdjuster(46654),
      new LegacyWaitCheckpointCostOffsetAdjuster(1.78),
    ],
    [],
    2.2,
    96210.7,
  );
}
