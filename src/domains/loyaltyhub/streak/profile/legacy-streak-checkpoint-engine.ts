import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyStreakCheckpoint } from "./legacy-streak-checkpoint.js";

/** One step of the legacy streak checkpoint calculation. */
export interface LegacyStreakCheckpointAdjuster {
  describe(): string;
  adjust(item: LegacyStreakCheckpoint, value: number): number;
}

export class FlaggedLegacyStreakCheckpointAdjuster implements LegacyStreakCheckpointAdjuster {
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

  adjust(item: LegacyStreakCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyStreakCheckpointAdjuster implements LegacyStreakCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyStreakCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyStreakCheckpointAdjuster implements LegacyStreakCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyStreakCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy streak checkpoint steps in order and keeps a trace of each. */
export class LegacyStreakCheckpointEngine {
  steps: LegacyStreakCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyStreakCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyStreakCheckpoint): number {
    let current = item.weightedValue();
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

  evaluateAll(items: LegacyStreakCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyStreakCheckpointEngine(flagsValue: flags.Registry): LegacyStreakCheckpointEngine {
  return new LegacyStreakCheckpointEngine(
    [
      new FlaggedLegacyStreakCheckpointAdjuster(flagsValue, "legacy-streak-checkpoint-seasonal", 3.1),
      new CapLegacyStreakCheckpointAdjuster(20759),
      new RoundingLegacyStreakCheckpointAdjuster(0.05),
    ],
    [],
    2.5,
    88249.9,
  );
}
