import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualLeaderboardCheckpoint } from "./manual-leaderboard-checkpoint.js";

/** One step of the manual leaderboard checkpoint calculation. */
export interface ManualLeaderboardCheckpointModifier {
  describe(): string;
  adjust(item: ManualLeaderboardCheckpoint, value: number): number;
}

export class FlaggedManualLeaderboardCheckpointAdjuster implements ManualLeaderboardCheckpointModifier {
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

  adjust(item: ManualLeaderboardCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleManualLeaderboardCheckpointAdjuster implements ManualLeaderboardCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualLeaderboardCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualLeaderboardCheckpointGraceDaysOffsetAdjuster implements ManualLeaderboardCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ManualLeaderboardCheckpoint, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumManualLeaderboardCheckpointAdjuster implements ManualLeaderboardCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualLeaderboardCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual leaderboard checkpoint steps in order and keeps a trace of each. */
export class ManualLeaderboardCheckpointEngine {
  steps: ManualLeaderboardCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualLeaderboardCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualLeaderboardCheckpoint): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ManualLeaderboardCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualLeaderboardCheckpointEngine(flagsValue: flags.Registry): ManualLeaderboardCheckpointEngine {
  return new ManualLeaderboardCheckpointEngine(
    [
      new FlaggedManualLeaderboardCheckpointAdjuster(flagsValue, "manual-leaderboard-checkpoint-seasonal", 9.9),
      new TitleManualLeaderboardCheckpointAdjuster(
        new Map<string, number>([["online", 1.32], ["south", 1.14], ["north", 1.12]]),
      ),
      new ManualLeaderboardCheckpointGraceDaysOffsetAdjuster(0.24),
      new MinimumManualLeaderboardCheckpointAdjuster(47.1),
    ],
    [],
    4.7,
    4628.3,
  );
}
