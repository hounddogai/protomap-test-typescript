import * as flags from "../../../../kit/flags.js";
import { GlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

/** One step of the global deflection checkpoint calculation. */
export interface GlobalDeflectionCheckpointStep {
  describe(): string;
  adjust(item: GlobalDeflectionCheckpoint, value: number): number;
}

export class GlobalDeflectionCheckpointCeilingOffsetAdjuster implements GlobalDeflectionCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: GlobalDeflectionCheckpoint, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CapGlobalDeflectionCheckpointAdjuster implements GlobalDeflectionCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalDeflectionCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentGlobalDeflectionCheckpointAdjuster implements GlobalDeflectionCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalDeflectionCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitGlobalDeflectionCheckpointAdjuster implements GlobalDeflectionCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: GlobalDeflectionCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedGlobalDeflectionCheckpointAdjuster implements GlobalDeflectionCheckpointStep {
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

  adjust(item: GlobalDeflectionCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalDeflectionCheckpointAdjuster implements GlobalDeflectionCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalDeflectionCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global deflection checkpoint steps in order and keeps a trace of each. */
export class GlobalDeflectionCheckpointEngine {
  steps: GlobalDeflectionCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDeflectionCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalDeflectionCheckpoint): number {
    let current = item.netVolume();
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

  evaluateAll(items: GlobalDeflectionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalDeflectionCheckpointEngine(flagsValue: flags.Registry): GlobalDeflectionCheckpointEngine {
  return new GlobalDeflectionCheckpointEngine(
    [
      new GlobalDeflectionCheckpointCeilingOffsetAdjuster(0.3),
      new CapGlobalDeflectionCheckpointAdjuster(32594),
      new PercentGlobalDeflectionCheckpointAdjuster(14.3),
      new UnitGlobalDeflectionCheckpointAdjuster(
        new Map<string, number>([["north", 1.17], ["online", 0.72], ["west", 0.79]]),
      ),
      new FlaggedGlobalDeflectionCheckpointAdjuster(flagsValue, "global-deflection-checkpoint-primary", -8.1),
      new MinimumGlobalDeflectionCheckpointAdjuster(40.8),
    ],
    [],
    3.2,
    94919.8,
  );
}
