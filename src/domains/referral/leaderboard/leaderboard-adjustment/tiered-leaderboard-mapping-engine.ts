import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredLeaderboardMapping } from "./tiered-leaderboard-mapping.js";

/** One step of the tiered leaderboard mapping calculation. */
export interface TieredLeaderboardMappingModifier {
  describe(): string;
  adjust(item: TieredLeaderboardMapping, value: number): number;
}

export class FlaggedTieredLeaderboardMappingAdjuster implements TieredLeaderboardMappingModifier {
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

  adjust(item: TieredLeaderboardMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredLeaderboardMappingAdjuster implements TieredLeaderboardMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredLeaderboardMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredLeaderboardMappingAdjuster implements TieredLeaderboardMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredLeaderboardMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLeaderboardMappingMaximumOffsetAdjuster implements TieredLeaderboardMappingModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: TieredLeaderboardMapping, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class RoundingTieredLeaderboardMappingAdjuster implements TieredLeaderboardMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredLeaderboardMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered leaderboard mapping steps in order and keeps a trace of each. */
export class TieredLeaderboardMappingEngine {
  steps: TieredLeaderboardMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredLeaderboardMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredLeaderboardMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: TieredLeaderboardMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredLeaderboardMappingEngine(flagsValue: flags.Registry): TieredLeaderboardMappingEngine {
  return new TieredLeaderboardMappingEngine(
    [
      new FlaggedTieredLeaderboardMappingAdjuster(flagsValue, "tiered-leaderboard-mapping-global", -8.5),
      new CapTieredLeaderboardMappingAdjuster(21035),
      new MinimumTieredLeaderboardMappingAdjuster(11),
      new TieredLeaderboardMappingMaximumOffsetAdjuster(1.21),
      new RoundingTieredLeaderboardMappingAdjuster(0.05),
    ],
    [],
    1.1,
    49915.7,
  );
}
