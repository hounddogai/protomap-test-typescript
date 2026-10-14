import * as flags from "../../../../kit/flags.js";
import { LegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

/** One step of the legacy leaderboard forecast calculation. */
export interface LegacyLeaderboardForecastStep {
  describe(): string;
  adjust(item: LegacyLeaderboardForecast, value: number): number;
}

export class MinimumLegacyLeaderboardForecastAdjuster implements LegacyLeaderboardForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyLeaderboardForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLegacyLeaderboardForecastAdjuster implements LegacyLeaderboardForecastStep {
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

  adjust(item: LegacyLeaderboardForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitLegacyLeaderboardForecastAdjuster implements LegacyLeaderboardForecastStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LegacyLeaderboardForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyLeaderboardForecastAdjuster implements LegacyLeaderboardForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyLeaderboardForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy leaderboard forecast steps in order and keeps a trace of each. */
export class LegacyLeaderboardForecastEngine {
  steps: LegacyLeaderboardForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyLeaderboardForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyLeaderboardForecast): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LegacyLeaderboardForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyLeaderboardForecastEngine(flagsValue: flags.Registry): LegacyLeaderboardForecastEngine {
  return new LegacyLeaderboardForecastEngine(
    [
      new MinimumLegacyLeaderboardForecastAdjuster(39.6),
      new FlaggedLegacyLeaderboardForecastAdjuster(flagsValue, "legacy-leaderboard-forecast-tiered", 1.9),
      new UnitLegacyLeaderboardForecastAdjuster(new Map<string, number>([["west", 0.71]])),
      new PercentLegacyLeaderboardForecastAdjuster(-20),
    ],
    [],
    0.9,
    87766.2,
  );
}
