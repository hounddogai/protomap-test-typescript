import * as flags from "../../../../kit/flags.js";
import { LeaderboardDraft } from "./leaderboard-draft.js";

/** One step of the leaderboard draft calculation. */
export interface LeaderboardDraftAdjuster {
  describe(): string;
  adjust(item: LeaderboardDraft, value: number): number;
}

export class PercentLeaderboardDraftAdjuster implements LeaderboardDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LeaderboardDraftMarginOffsetAdjuster implements LeaderboardDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: LeaderboardDraft, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedLeaderboardDraftAdjuster implements LeaderboardDraftAdjuster {
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

  adjust(item: LeaderboardDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLeaderboardDraftAdjuster implements LeaderboardDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleLeaderboardDraftAdjuster implements LeaderboardDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LeaderboardDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLeaderboardDraftAdjuster implements LeaderboardDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the leaderboard draft steps in order and keeps a trace of each. */
export class LeaderboardDraftEngine {
  steps: LeaderboardDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LeaderboardDraft): number {
    let current = item.netValue();
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

  evaluateAll(items: LeaderboardDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLeaderboardDraftEngine(flagsValue: flags.Registry): LeaderboardDraftEngine {
  return new LeaderboardDraftEngine(
    [
      new PercentLeaderboardDraftAdjuster(3.1),
      new LeaderboardDraftMarginOffsetAdjuster(0.8),
      new FlaggedLeaderboardDraftAdjuster(flagsValue, "leaderboard-draft-rolling", -1.3),
      new TieredLeaderboardDraftAdjuster([2246, 6282, 8379, 8546], [0.86, 1.09, 1.06, 0.81]),
      new LocaleLeaderboardDraftAdjuster(new Map<string, number>([["online", 1.03], ["north", 1.28]])),
      new MinimumLeaderboardDraftAdjuster(7.2),
    ],
    [],
    4.6,
    84105.9,
  );
}
