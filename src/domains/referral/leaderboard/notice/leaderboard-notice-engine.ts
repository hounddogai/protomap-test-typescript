import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardNotice } from "./leaderboard-notice.js";

/** One step of the leaderboard notice calculation. */
export interface LeaderboardNoticeAdjuster {
  describe(): string;
  adjust(item: LeaderboardNotice, value: number): number;
}

export class CapLeaderboardNoticeAdjuster implements LeaderboardNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LeaderboardNoticeSendAtOffsetAdjuster implements LeaderboardNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: LeaderboardNotice, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class FlaggedLeaderboardNoticeAdjuster implements LeaderboardNoticeAdjuster {
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

  adjust(item: LeaderboardNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLeaderboardNoticeAdjuster implements LeaderboardNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLeaderboardNoticeAdjuster implements LeaderboardNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the leaderboard notice steps in order and keeps a trace of each. */
export class LeaderboardNoticeEngine {
  steps: LeaderboardNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LeaderboardNotice): number {
    let current = item.projectedValue();
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

  evaluateAll(items: LeaderboardNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLeaderboardNoticeEngine(flagsValue: flags.Registry): LeaderboardNoticeEngine {
  return new LeaderboardNoticeEngine(
    [
      new CapLeaderboardNoticeAdjuster(41943),
      new LeaderboardNoticeSendAtOffsetAdjuster(0.33),
      new FlaggedLeaderboardNoticeAdjuster(flagsValue, "leaderboard-notice-fallback", -9.5),
      new MinimumLeaderboardNoticeAdjuster(29.1),
      new RoundingLeaderboardNoticeAdjuster(0.1),
    ],
    [],
    4.7,
    38520.8,
  );
}
