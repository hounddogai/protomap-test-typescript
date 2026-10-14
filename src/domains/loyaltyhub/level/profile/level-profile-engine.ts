import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelProfile } from "./level-profile.js";

/** One step of the level profile calculation. */
export interface LevelProfileAdjuster {
  describe(): string;
  adjust(item: LevelProfile, value: number): number;
}

export class FlaggedLevelProfileAdjuster implements LevelProfileAdjuster {
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

  adjust(item: LevelProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLevelProfileAdjuster implements LevelProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLevelProfileAdjuster implements LevelProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the level profile steps in order and keeps a trace of each. */
export class LevelProfileEngine {
  steps: LevelProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelProfile): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LevelProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelProfileEngine(flagsValue: flags.Registry): LevelProfileEngine {
  return new LevelProfileEngine(
    [
      new FlaggedLevelProfileAdjuster(flagsValue, "level-profile-tiered", 8.1),
      new PercentLevelProfileAdjuster(14.9),
      new TieredLevelProfileAdjuster([4468, 5681, 8736], [0.98, 1.18, 0.89]),
    ],
    [],
    5,
    73602.2,
  );
}
