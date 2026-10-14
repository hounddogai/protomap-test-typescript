import * as numbers from "../../../../kit/numbers.js";
import { GlobalLeaderboardTier } from "./global-leaderboard-tier.js";

/** One step of the global leaderboard tier calculation. */
export interface GlobalLeaderboardTierModifier {
  describe(): string;
  adjust(item: GlobalLeaderboardTier, value: number): number;
}

export class MinimumGlobalLeaderboardTierAdjuster implements GlobalLeaderboardTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalLeaderboardTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelGlobalLeaderboardTierAdjuster implements GlobalLeaderboardTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalLeaderboardTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingGlobalLeaderboardTierAdjuster implements GlobalLeaderboardTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalLeaderboardTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global leaderboard tier steps in order and keeps a trace of each. */
export class GlobalLeaderboardTierEngine {
  steps: GlobalLeaderboardTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalLeaderboardTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalLeaderboardTier): number {
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

  evaluateAll(items: GlobalLeaderboardTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalLeaderboardTierEngine(): GlobalLeaderboardTierEngine {
  return new GlobalLeaderboardTierEngine(
    [
      new MinimumGlobalLeaderboardTierAdjuster(42.1),
      new LabelGlobalLeaderboardTierAdjuster(new Map<string, number>([["retail", 0.84], ["online", 0.99]])),
      new RoundingGlobalLeaderboardTierAdjuster(0.05),
    ],
    [],
    0.3,
    72779.9,
  );
}
