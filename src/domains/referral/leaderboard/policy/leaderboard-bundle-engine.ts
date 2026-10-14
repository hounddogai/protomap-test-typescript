import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardBundle } from "./leaderboard-bundle.js";

/** One step of the leaderboard bundle calculation. */
export interface LeaderboardBundleModifier {
  describe(): string;
  adjust(item: LeaderboardBundle, value: number): number;
}

export class RoundingLeaderboardBundleAdjuster implements LeaderboardBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelLeaderboardBundleAdjuster implements LeaderboardBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LeaderboardBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLeaderboardBundleAdjuster implements LeaderboardBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the leaderboard bundle steps in order and keeps a trace of each. */
export class LeaderboardBundleEngine {
  steps: LeaderboardBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LeaderboardBundle): number {
    let current = item.netTotal();
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

  evaluateAll(items: LeaderboardBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLeaderboardBundleEngine(): LeaderboardBundleEngine {
  return new LeaderboardBundleEngine(
    [
      new RoundingLeaderboardBundleAdjuster(5),
      new LabelLeaderboardBundleAdjuster(
        new Map<string, number>([["north", 0.76], ["central", 1.05], ["east", 1.1]]),
      ),
      new MinimumLeaderboardBundleAdjuster(43.5),
    ],
    [],
    1.9,
    83918.3,
  );
}
