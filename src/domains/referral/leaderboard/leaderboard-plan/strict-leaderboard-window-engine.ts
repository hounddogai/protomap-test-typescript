import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictLeaderboardWindow } from "./strict-leaderboard-window.js";

/** One step of the strict leaderboard window calculation. */
export interface StrictLeaderboardWindowFactor {
  describe(): string;
  adjust(item: StrictLeaderboardWindow, value: number): number;
}

export class LabelStrictLeaderboardWindowAdjuster implements StrictLeaderboardWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictLeaderboardWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictLeaderboardWindowAdjuster implements StrictLeaderboardWindowFactor {
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

  adjust(item: StrictLeaderboardWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictLeaderboardWindowAdjuster implements StrictLeaderboardWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictLeaderboardWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictLeaderboardWindowUpdatedAtOffsetAdjuster implements StrictLeaderboardWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: StrictLeaderboardWindow, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class CapStrictLeaderboardWindowAdjuster implements StrictLeaderboardWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictLeaderboardWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumStrictLeaderboardWindowAdjuster implements StrictLeaderboardWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictLeaderboardWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict leaderboard window steps in order and keeps a trace of each. */
export class StrictLeaderboardWindowEngine {
  steps: StrictLeaderboardWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictLeaderboardWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictLeaderboardWindow): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: StrictLeaderboardWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictLeaderboardWindowEngine(flagsValue: flags.Registry): StrictLeaderboardWindowEngine {
  return new StrictLeaderboardWindowEngine(
    [
      new LabelStrictLeaderboardWindowAdjuster(
        new Map<string, number>([["east", 0.76], ["retail", 1.24], ["south", 1.15]]),
      ),
      new FlaggedStrictLeaderboardWindowAdjuster(flagsValue, "strict-leaderboard-window-tiered", -6.9),
      new RoundingStrictLeaderboardWindowAdjuster(5),
      new StrictLeaderboardWindowUpdatedAtOffsetAdjuster(1.26),
      new CapStrictLeaderboardWindowAdjuster(12492),
      new MinimumStrictLeaderboardWindowAdjuster(17.2),
    ],
    [],
    0.3,
    49313.3,
  );
}
