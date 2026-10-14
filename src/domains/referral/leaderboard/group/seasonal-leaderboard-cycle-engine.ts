import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalLeaderboardCycle } from "./seasonal-leaderboard-cycle.js";

/** One step of the seasonal leaderboard cycle calculation. */
export interface SeasonalLeaderboardCycleStep {
  describe(): string;
  adjust(item: SeasonalLeaderboardCycle, value: number): number;
}

export class RoundingSeasonalLeaderboardCycleAdjuster implements SeasonalLeaderboardCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalLeaderboardCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSeasonalLeaderboardCycleAdjuster implements SeasonalLeaderboardCycleStep {
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

  adjust(item: SeasonalLeaderboardCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalLeaderboardCycleAdjuster implements SeasonalLeaderboardCycleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalLeaderboardCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSeasonalLeaderboardCycleAdjuster implements SeasonalLeaderboardCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalLeaderboardCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalLeaderboardCycleAdjuster implements SeasonalLeaderboardCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalLeaderboardCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal leaderboard cycle steps in order and keeps a trace of each. */
export class SeasonalLeaderboardCycleEngine {
  steps: SeasonalLeaderboardCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalLeaderboardCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalLeaderboardCycle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SeasonalLeaderboardCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalLeaderboardCycleEngine(flagsValue: flags.Registry): SeasonalLeaderboardCycleEngine {
  return new SeasonalLeaderboardCycleEngine(
    [
      new RoundingSeasonalLeaderboardCycleAdjuster(0.25),
      new FlaggedSeasonalLeaderboardCycleAdjuster(flagsValue, "seasonal-leaderboard-cycle-fallback", -3.6),
      new MinimumSeasonalLeaderboardCycleAdjuster(18.5),
      new PercentSeasonalLeaderboardCycleAdjuster(-2.3),
      new TieredSeasonalLeaderboardCycleAdjuster([965, 3404, 4061, 6405], [1, 1.09, 0.92, 0.85]),
    ],
    [],
    0.4,
    47322.4,
  );
}
