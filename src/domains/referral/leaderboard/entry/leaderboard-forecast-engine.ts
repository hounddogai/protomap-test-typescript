import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardForecast } from "./leaderboard-forecast.js";

/** One step of the leaderboard forecast calculation. */
export interface LeaderboardForecastModifier {
  describe(): string;
  adjust(item: LeaderboardForecast, value: number): number;
}

export class LocaleLeaderboardForecastAdjuster implements LeaderboardForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LeaderboardForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLeaderboardForecastAdjuster implements LeaderboardForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLeaderboardForecastAdjuster implements LeaderboardForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLeaderboardForecastAdjuster implements LeaderboardForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLeaderboardForecastAdjuster implements LeaderboardForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LeaderboardForecastBudgetOffsetAdjuster implements LeaderboardForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: LeaderboardForecast, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the leaderboard forecast steps in order and keeps a trace of each. */
export class LeaderboardForecastEngine {
  steps: LeaderboardForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LeaderboardForecast): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LeaderboardForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLeaderboardForecastEngine(): LeaderboardForecastEngine {
  return new LeaderboardForecastEngine(
    [
      new LocaleLeaderboardForecastAdjuster(new Map<string, number>([["east", 1.13], ["south", 0.78]])),
      new MinimumLeaderboardForecastAdjuster(32.4),
      new PercentLeaderboardForecastAdjuster(-14.5),
      new TieredLeaderboardForecastAdjuster([904, 8941], [1.19, 1.05]),
      new CapLeaderboardForecastAdjuster(33764),
      new LeaderboardForecastBudgetOffsetAdjuster(1.72),
    ],
    [],
    4.7,
    64378.1,
  );
}
