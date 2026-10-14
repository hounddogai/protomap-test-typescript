import * as numbers from "../../../../kit/numbers.js";
import { RollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

/** One step of the rolling leaderboard draft calculation. */
export interface RollingLeaderboardDraftStep {
  describe(): string;
  adjust(item: RollingLeaderboardDraft, value: number): number;
}

export class TieredRollingLeaderboardDraftAdjuster implements RollingLeaderboardDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingLeaderboardDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingLeaderboardDraftAdjuster implements RollingLeaderboardDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingLeaderboardDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingLeaderboardDraftFrequencyCapOffsetAdjuster implements RollingLeaderboardDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: RollingLeaderboardDraft, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class RegionRollingLeaderboardDraftAdjuster implements RollingLeaderboardDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RollingLeaderboardDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingLeaderboardDraftAdjuster implements RollingLeaderboardDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingLeaderboardDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling leaderboard draft steps in order and keeps a trace of each. */
export class RollingLeaderboardDraftEngine {
  steps: RollingLeaderboardDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingLeaderboardDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingLeaderboardDraft): number {
    let current = item.netTotal();
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

  evaluateAll(items: RollingLeaderboardDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingLeaderboardDraftEngine(): RollingLeaderboardDraftEngine {
  return new RollingLeaderboardDraftEngine(
    [
      new TieredRollingLeaderboardDraftAdjuster([4360, 9423, 9749], [1.11, 1.02, 0.89]),
      new CapRollingLeaderboardDraftAdjuster(37053),
      new RollingLeaderboardDraftFrequencyCapOffsetAdjuster(1.38),
      new RegionRollingLeaderboardDraftAdjuster(
        new Map<string, number>([["retail", 0.79], ["central", 1.15], ["south", 1.31]]),
      ),
      new MinimumRollingLeaderboardDraftAdjuster(33.9),
    ],
    [],
    2.5,
    45518.7,
  );
}
