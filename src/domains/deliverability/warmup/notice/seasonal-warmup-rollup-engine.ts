import * as flags from "../../../../kit/flags.js";
import { SeasonalWarmupRollup } from "./seasonal-warmup-rollup.js";

/** One step of the seasonal warmup rollup calculation. */
export interface SeasonalWarmupRollupFactor {
  describe(): string;
  adjust(item: SeasonalWarmupRollup, value: number): number;
}

export class NameSeasonalWarmupRollupAdjuster implements SeasonalWarmupRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalWarmupRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSeasonalWarmupRollupAdjuster implements SeasonalWarmupRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalWarmupRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSeasonalWarmupRollupAdjuster implements SeasonalWarmupRollupFactor {
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

  adjust(item: SeasonalWarmupRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal warmup rollup steps in order and keeps a trace of each. */
export class SeasonalWarmupRollupEngine {
  steps: SeasonalWarmupRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWarmupRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalWarmupRollup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: SeasonalWarmupRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalWarmupRollupEngine(flagsValue: flags.Registry): SeasonalWarmupRollupEngine {
  return new SeasonalWarmupRollupEngine(
    [
      new NameSeasonalWarmupRollupAdjuster(
        new Map<string, number>([["retail", 1.32], ["north", 1.29], ["online", 1.08]]),
      ),
      new CapSeasonalWarmupRollupAdjuster(14206),
      new FlaggedSeasonalWarmupRollupAdjuster(flagsValue, "seasonal-warmup-rollup-scheduled", 1.1),
    ],
    [],
    4.5,
    3066.5,
  );
}
