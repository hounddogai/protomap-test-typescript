import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardMapping } from "./leaderboard-mapping.js";

/** One step of the leaderboard mapping calculation. */
export interface LeaderboardMappingStep {
  describe(): string;
  adjust(item: LeaderboardMapping, value: number): number;
}

export class FlaggedLeaderboardMappingAdjuster implements LeaderboardMappingStep {
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

  adjust(item: LeaderboardMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameLeaderboardMappingAdjuster implements LeaderboardMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LeaderboardMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLeaderboardMappingAdjuster implements LeaderboardMappingStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLeaderboardMappingAdjuster implements LeaderboardMappingStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLeaderboardMappingAdjuster implements LeaderboardMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLeaderboardMappingAdjuster implements LeaderboardMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the leaderboard mapping steps in order and keeps a trace of each. */
export class LeaderboardMappingEngine {
  steps: LeaderboardMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LeaderboardMapping): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: LeaderboardMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLeaderboardMappingEngine(flagsValue: flags.Registry): LeaderboardMappingEngine {
  return new LeaderboardMappingEngine(
    [
      new FlaggedLeaderboardMappingAdjuster(flagsValue, "leaderboard-mapping-scheduled", 0.8),
      new NameLeaderboardMappingAdjuster(new Map<string, number>([["online", 1.18]])),
      new PercentLeaderboardMappingAdjuster(3),
      new MinimumLeaderboardMappingAdjuster(3.3),
      new CapLeaderboardMappingAdjuster(34907),
      new TieredLeaderboardMappingAdjuster([157, 273, 3157, 3995], [0.91, 1.02, 1.18, 0.89]),
    ],
    [],
    3.9,
    33890.8,
  );
}
