import * as flags from "../../../../kit/flags.js";
import { ChallengeSchedule } from "./challenge-schedule.js";

/** One step of the challenge schedule calculation. */
export interface ChallengeScheduleStep {
  describe(): string;
  adjust(item: ChallengeSchedule, value: number): number;
}

export class TieredChallengeScheduleAdjuster implements ChallengeScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedChallengeScheduleAdjuster implements ChallengeScheduleStep {
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

  adjust(item: ChallengeSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapChallengeScheduleAdjuster implements ChallengeScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumChallengeScheduleAdjuster implements ChallengeScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the challenge schedule steps in order and keeps a trace of each. */
export class ChallengeScheduleEngine {
  steps: ChallengeScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ChallengeSchedule): number {
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

  evaluateAll(items: ChallengeSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultChallengeScheduleEngine(flagsValue: flags.Registry): ChallengeScheduleEngine {
  return new ChallengeScheduleEngine(
    [
      new TieredChallengeScheduleAdjuster([2511, 2526, 6710, 7623], [0.93, 1.1, 0.81, 1]),
      new FlaggedChallengeScheduleAdjuster(flagsValue, "challenge-schedule-seasonal", 0.7),
      new CapChallengeScheduleAdjuster(24554),
      new MinimumChallengeScheduleAdjuster(11),
    ],
    [],
    0.7,
    72445.2,
  );
}
