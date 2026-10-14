import * as flags from "../../../../kit/flags.js";
import { TieredLeaderboardSummary } from "./tiered-leaderboard-summary.js";

/** One step of the tiered leaderboard summary calculation. */
export interface TieredLeaderboardSummaryStep {
  describe(): string;
  adjust(item: TieredLeaderboardSummary, value: number): number;
}

export class CapTieredLeaderboardSummaryAdjuster implements TieredLeaderboardSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredLeaderboardSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredLeaderboardSummaryAdjuster implements TieredLeaderboardSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredLeaderboardSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredLeaderboardSummaryAdjuster implements TieredLeaderboardSummaryStep {
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

  adjust(item: TieredLeaderboardSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelTieredLeaderboardSummaryAdjuster implements TieredLeaderboardSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredLeaderboardSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered leaderboard summary steps in order and keeps a trace of each. */
export class TieredLeaderboardSummaryEngine {
  steps: TieredLeaderboardSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredLeaderboardSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredLeaderboardSummary): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: TieredLeaderboardSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredLeaderboardSummaryEngine(flagsValue: flags.Registry): TieredLeaderboardSummaryEngine {
  return new TieredLeaderboardSummaryEngine(
    [
      new CapTieredLeaderboardSummaryAdjuster(9278),
      new PercentTieredLeaderboardSummaryAdjuster(-4.2),
      new FlaggedTieredLeaderboardSummaryAdjuster(flagsValue, "tiered-leaderboard-summary-weighted", 9.9),
      new ChannelTieredLeaderboardSummaryAdjuster(
        new Map<string, number>([["central", 1.13], ["south", 1.33], ["east", 1.39]]),
      ),
    ],
    [],
    4,
    7425.9,
  );
}
