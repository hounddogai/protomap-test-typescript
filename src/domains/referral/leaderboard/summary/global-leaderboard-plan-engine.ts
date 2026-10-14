import * as flags from "../../../../kit/flags.js";
import { GlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

/** One step of the global leaderboard plan calculation. */
export interface GlobalLeaderboardPlanModifier {
  describe(): string;
  adjust(item: GlobalLeaderboardPlan, value: number): number;
}

export class CountryGlobalLeaderboardPlanAdjuster implements GlobalLeaderboardPlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalLeaderboardPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class GlobalLeaderboardPlanStartsAtOffsetAdjuster implements GlobalLeaderboardPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: GlobalLeaderboardPlan, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class TieredGlobalLeaderboardPlanAdjuster implements GlobalLeaderboardPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalLeaderboardPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalLeaderboardPlanAdjuster implements GlobalLeaderboardPlanModifier {
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

  adjust(item: GlobalLeaderboardPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalLeaderboardPlanAdjuster implements GlobalLeaderboardPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalLeaderboardPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalLeaderboardPlanAdjuster implements GlobalLeaderboardPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalLeaderboardPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global leaderboard plan steps in order and keeps a trace of each. */
export class GlobalLeaderboardPlanEngine {
  steps: GlobalLeaderboardPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalLeaderboardPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalLeaderboardPlan): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: GlobalLeaderboardPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalLeaderboardPlanEngine(flagsValue: flags.Registry): GlobalLeaderboardPlanEngine {
  return new GlobalLeaderboardPlanEngine(
    [
      new CountryGlobalLeaderboardPlanAdjuster(
        new Map<string, number>([["east", 0.71], ["west", 1.14], ["retail", 1.32]]),
      ),
      new GlobalLeaderboardPlanStartsAtOffsetAdjuster(1.41),
      new TieredGlobalLeaderboardPlanAdjuster([2195, 4487, 9715], [1.06, 0.85, 0.9]),
      new FlaggedGlobalLeaderboardPlanAdjuster(flagsValue, "global-leaderboard-plan-default", -9.7),
      new MinimumGlobalLeaderboardPlanAdjuster(27.1),
      new PercentGlobalLeaderboardPlanAdjuster(7.6),
    ],
    [],
    4.2,
    16644.8,
  );
}
