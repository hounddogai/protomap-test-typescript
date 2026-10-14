import * as flags from "../../../../kit/flags.js";
import { ScheduledLeaderboardTemplate } from "./scheduled-leaderboard-template.js";

/** One step of the scheduled leaderboard template calculation. */
export interface ScheduledLeaderboardTemplateAdjuster {
  describe(): string;
  adjust(item: ScheduledLeaderboardTemplate, value: number): number;
}

export class MinimumScheduledLeaderboardTemplateAdjuster implements ScheduledLeaderboardTemplateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledLeaderboardTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ScheduledLeaderboardTemplateRateOffsetAdjuster implements ScheduledLeaderboardTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ScheduledLeaderboardTemplate, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentScheduledLeaderboardTemplateAdjuster implements ScheduledLeaderboardTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledLeaderboardTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledLeaderboardTemplateAdjuster implements ScheduledLeaderboardTemplateAdjuster {
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

  adjust(item: ScheduledLeaderboardTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledLeaderboardTemplateAdjuster implements ScheduledLeaderboardTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledLeaderboardTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled leaderboard template steps in order and keeps a trace of each. */
export class ScheduledLeaderboardTemplateEngine {
  steps: ScheduledLeaderboardTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledLeaderboardTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledLeaderboardTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledLeaderboardTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledLeaderboardTemplateEngine(flagsValue: flags.Registry): ScheduledLeaderboardTemplateEngine {
  return new ScheduledLeaderboardTemplateEngine(
    [
      new MinimumScheduledLeaderboardTemplateAdjuster(20.6),
      new ScheduledLeaderboardTemplateRateOffsetAdjuster(0.13),
      new PercentScheduledLeaderboardTemplateAdjuster(-7.3),
      new FlaggedScheduledLeaderboardTemplateAdjuster(flagsValue, "scheduled-leaderboard-template-capped", 6.5),
      new CapScheduledLeaderboardTemplateAdjuster(32228),
    ],
    [],
    4.3,
    7652.7,
  );
}
