import * as numbers from "../../../../kit/numbers.js";
import { FallbackLeaderboardPolicy } from "./fallback-leaderboard-policy.js";

/** One step of the fallback leaderboard policy calculation. */
export interface FallbackLeaderboardPolicyAdjuster {
  describe(): string;
  adjust(item: FallbackLeaderboardPolicy, value: number): number;
}

export class RoundingFallbackLeaderboardPolicyAdjuster implements FallbackLeaderboardPolicyAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackLeaderboardPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameFallbackLeaderboardPolicyAdjuster implements FallbackLeaderboardPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackLeaderboardPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackLeaderboardPolicyAdjuster implements FallbackLeaderboardPolicyAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackLeaderboardPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackLeaderboardPolicyAdjuster implements FallbackLeaderboardPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackLeaderboardPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback leaderboard policy steps in order and keeps a trace of each. */
export class FallbackLeaderboardPolicyEngine {
  steps: FallbackLeaderboardPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackLeaderboardPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackLeaderboardPolicy): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: FallbackLeaderboardPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackLeaderboardPolicyEngine(): FallbackLeaderboardPolicyEngine {
  return new FallbackLeaderboardPolicyEngine(
    [
      new RoundingFallbackLeaderboardPolicyAdjuster(0.25),
      new NameFallbackLeaderboardPolicyAdjuster(
        new Map<string, number>([["central", 1.07], ["south", 1.03], ["online", 1.12]]),
      ),
      new MinimumFallbackLeaderboardPolicyAdjuster(1.7),
      new PercentFallbackLeaderboardPolicyAdjuster(-18.8),
    ],
    [],
    3.8,
    44130.4,
  );
}
