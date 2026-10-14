import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalLeaderboardRollup } from "./seasonal-leaderboard-rollup.js";

/** One step of the seasonal leaderboard rollup calculation. */
export interface SeasonalLeaderboardRollupStep {
  describe(): string;
  adjust(item: SeasonalLeaderboardRollup, value: number): number;
}

export class RoundingSeasonalLeaderboardRollupAdjuster implements SeasonalLeaderboardRollupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalLeaderboardRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSeasonalLeaderboardRollupAdjuster implements SeasonalLeaderboardRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalLeaderboardRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalLeaderboardRollupAdjuster implements SeasonalLeaderboardRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalLeaderboardRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSeasonalLeaderboardRollupAdjuster implements SeasonalLeaderboardRollupStep {
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

  adjust(item: SeasonalLeaderboardRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalLeaderboardRollupAdjuster implements SeasonalLeaderboardRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalLeaderboardRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountrySeasonalLeaderboardRollupAdjuster implements SeasonalLeaderboardRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalLeaderboardRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal leaderboard rollup steps in order and keeps a trace of each. */
export class SeasonalLeaderboardRollupEngine {
  steps: SeasonalLeaderboardRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalLeaderboardRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalLeaderboardRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SeasonalLeaderboardRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalLeaderboardRollupEngine(flagsValue: flags.Registry): SeasonalLeaderboardRollupEngine {
  return new SeasonalLeaderboardRollupEngine(
    [
      new RoundingSeasonalLeaderboardRollupAdjuster(0.05),
      new CapSeasonalLeaderboardRollupAdjuster(12744),
      new PercentSeasonalLeaderboardRollupAdjuster(18.7),
      new FlaggedSeasonalLeaderboardRollupAdjuster(flagsValue, "seasonal-leaderboard-rollup-scheduled", 3.5),
      new MinimumSeasonalLeaderboardRollupAdjuster(15.1),
      new CountrySeasonalLeaderboardRollupAdjuster(new Map<string, number>([["central", 1.25], ["east", 0.94]])),
    ],
    [],
    4,
    82113.2,
  );
}
