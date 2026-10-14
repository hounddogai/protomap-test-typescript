import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyLeaderboardDraft } from "./legacy-leaderboard-draft.js";

/** One step of the legacy leaderboard draft calculation. */
export interface LegacyLeaderboardDraftStep {
  describe(): string;
  adjust(item: LegacyLeaderboardDraft, value: number): number;
}

export class LegacyLeaderboardDraftRateOffsetAdjuster implements LegacyLeaderboardDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: LegacyLeaderboardDraft, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumLegacyLeaderboardDraftAdjuster implements LegacyLeaderboardDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyLeaderboardDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLegacyLeaderboardDraftAdjuster implements LegacyLeaderboardDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyLeaderboardDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLegacyLeaderboardDraftAdjuster implements LegacyLeaderboardDraftStep {
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

  adjust(item: LegacyLeaderboardDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLegacyLeaderboardDraftAdjuster implements LegacyLeaderboardDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyLeaderboardDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelLegacyLeaderboardDraftAdjuster implements LegacyLeaderboardDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyLeaderboardDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy leaderboard draft steps in order and keeps a trace of each. */
export class LegacyLeaderboardDraftEngine {
  steps: LegacyLeaderboardDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyLeaderboardDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyLeaderboardDraft): number {
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

  evaluateAll(items: LegacyLeaderboardDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyLeaderboardDraftEngine(flagsValue: flags.Registry): LegacyLeaderboardDraftEngine {
  return new LegacyLeaderboardDraftEngine(
    [
      new LegacyLeaderboardDraftRateOffsetAdjuster(0.14),
      new MinimumLegacyLeaderboardDraftAdjuster(28.7),
      new TieredLegacyLeaderboardDraftAdjuster([3515, 5189, 7581, 8738], [1.11, 1.07, 1.09, 0.91]),
      new FlaggedLegacyLeaderboardDraftAdjuster(flagsValue, "legacy-leaderboard-draft-scheduled", 8.8),
      new PercentLegacyLeaderboardDraftAdjuster(-3.4),
      new ChannelLegacyLeaderboardDraftAdjuster(new Map<string, number>([["central", 1.15], ["south", 1]])),
    ],
    [],
    2.4,
    58570.3,
  );
}
