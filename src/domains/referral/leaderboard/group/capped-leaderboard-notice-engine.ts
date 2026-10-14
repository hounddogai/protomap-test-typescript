import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

/** One step of the capped leaderboard notice calculation. */
export interface CappedLeaderboardNoticeAdjuster {
  describe(): string;
  adjust(item: CappedLeaderboardNotice, value: number): number;
}

export class RoundingCappedLeaderboardNoticeAdjuster implements CappedLeaderboardNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedLeaderboardNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedLeaderboardNoticeAdjuster implements CappedLeaderboardNoticeAdjuster {
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

  adjust(item: CappedLeaderboardNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedLeaderboardNoticeAdjuster implements CappedLeaderboardNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedLeaderboardNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCappedLeaderboardNoticeAdjuster implements CappedLeaderboardNoticeAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedLeaderboardNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedLeaderboardNoticeBudgetOffsetAdjuster implements CappedLeaderboardNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CappedLeaderboardNotice, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the capped leaderboard notice steps in order and keeps a trace of each. */
export class CappedLeaderboardNoticeEngine {
  steps: CappedLeaderboardNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedLeaderboardNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedLeaderboardNotice): number {
    let current = item.netLoad();
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

  evaluateAll(items: CappedLeaderboardNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedLeaderboardNoticeEngine(flagsValue: flags.Registry): CappedLeaderboardNoticeEngine {
  return new CappedLeaderboardNoticeEngine(
    [
      new RoundingCappedLeaderboardNoticeAdjuster(0.05),
      new FlaggedCappedLeaderboardNoticeAdjuster(flagsValue, "capped-leaderboard-notice-default", -6.7),
      new CapCappedLeaderboardNoticeAdjuster(28967),
      new PercentCappedLeaderboardNoticeAdjuster(-17.8),
      new CappedLeaderboardNoticeBudgetOffsetAdjuster(1.64),
    ],
    [],
    1.3,
    11837.6,
  );
}
