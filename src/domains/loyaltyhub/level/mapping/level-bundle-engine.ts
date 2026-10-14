import * as flags from "../../../../kit/flags.js";
import { LevelBundle } from "./level-bundle.js";

/** One step of the level bundle calculation. */
export interface LevelBundleAdjuster {
  describe(): string;
  adjust(item: LevelBundle, value: number): number;
}

export class FlaggedLevelBundleAdjuster implements LevelBundleAdjuster {
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

  adjust(item: LevelBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLevelBundleAdjuster implements LevelBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLevelBundleAdjuster implements LevelBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLevelBundleAdjuster implements LevelBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the level bundle steps in order and keeps a trace of each. */
export class LevelBundleEngine {
  steps: LevelBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LevelBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LevelBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLevelBundleEngine(flagsValue: flags.Registry): LevelBundleEngine {
  return new LevelBundleEngine(
    [
      new FlaggedLevelBundleAdjuster(flagsValue, "level-bundle-lenient", -0.5),
      new PercentLevelBundleAdjuster(8),
      new MinimumLevelBundleAdjuster(28.2),
      new CapLevelBundleAdjuster(26713),
    ],
    [],
    1.3,
    38169.8,
  );
}
