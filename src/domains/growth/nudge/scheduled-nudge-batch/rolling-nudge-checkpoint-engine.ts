import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

/** One step of the rolling nudge checkpoint calculation. */
export interface RollingNudgeCheckpointFactor {
  describe(): string;
  adjust(item: RollingNudgeCheckpoint, value: number): number;
}

export class PercentRollingNudgeCheckpointAdjuster implements RollingNudgeCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingNudgeCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRollingNudgeCheckpointAdjuster implements RollingNudgeCheckpointFactor {
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

  adjust(item: RollingNudgeCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingNudgeCheckpointAdjuster implements RollingNudgeCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingNudgeCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingNudgeCheckpointAdjuster implements RollingNudgeCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingNudgeCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingNudgeCheckpointMinimumOffsetAdjuster implements RollingNudgeCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: RollingNudgeCheckpoint, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class NameRollingNudgeCheckpointAdjuster implements RollingNudgeCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingNudgeCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling nudge checkpoint steps in order and keeps a trace of each. */
export class RollingNudgeCheckpointEngine {
  steps: RollingNudgeCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingNudgeCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingNudgeCheckpoint): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RollingNudgeCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingNudgeCheckpointEngine(flagsValue: flags.Registry): RollingNudgeCheckpointEngine {
  return new RollingNudgeCheckpointEngine(
    [
      new PercentRollingNudgeCheckpointAdjuster(11),
      new FlaggedRollingNudgeCheckpointAdjuster(flagsValue, "rolling-nudge-checkpoint-capped", 0),
      new RoundingRollingNudgeCheckpointAdjuster(0.1),
      new CapRollingNudgeCheckpointAdjuster(26524),
      new RollingNudgeCheckpointMinimumOffsetAdjuster(0.29),
      new NameRollingNudgeCheckpointAdjuster(new Map<string, number>([["south", 0.9], ["north", 0.75]])),
    ],
    [],
    4.9,
    49871.9,
  );
}
