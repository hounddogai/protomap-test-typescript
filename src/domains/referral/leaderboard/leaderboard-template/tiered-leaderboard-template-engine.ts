import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredLeaderboardTemplate } from "./tiered-leaderboard-template.js";

/** One step of the tiered leaderboard template calculation. */
export interface TieredLeaderboardTemplateAdjuster {
  describe(): string;
  adjust(item: TieredLeaderboardTemplate, value: number): number;
}

export class CapTieredLeaderboardTemplateAdjuster implements TieredLeaderboardTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredLeaderboardTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredLeaderboardTemplateAdjuster implements TieredLeaderboardTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredLeaderboardTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredLeaderboardTemplateAdjuster implements TieredLeaderboardTemplateAdjuster {
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

  adjust(item: TieredLeaderboardTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredLeaderboardTemplateAdjuster implements TieredLeaderboardTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredLeaderboardTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered leaderboard template steps in order and keeps a trace of each. */
export class TieredLeaderboardTemplateEngine {
  steps: TieredLeaderboardTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredLeaderboardTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredLeaderboardTemplate): number {
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

  evaluateAll(items: TieredLeaderboardTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredLeaderboardTemplateEngine(flagsValue: flags.Registry): TieredLeaderboardTemplateEngine {
  return new TieredLeaderboardTemplateEngine(
    [
      new CapTieredLeaderboardTemplateAdjuster(48204),
      new RoundingTieredLeaderboardTemplateAdjuster(0.5),
      new FlaggedTieredLeaderboardTemplateAdjuster(flagsValue, "tiered-leaderboard-template-lenient", -5.4),
      new PercentTieredLeaderboardTemplateAdjuster(-4.7),
    ],
    [],
    1.1,
    75801,
  );
}
