import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalChallengeProfile } from "./regional-challenge-profile.js";

/** One step of the regional challenge profile calculation. */
export interface RegionalChallengeProfileStep {
  describe(): string;
  adjust(item: RegionalChallengeProfile, value: number): number;
}

export class CapRegionalChallengeProfileAdjuster implements RegionalChallengeProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalChallengeProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalChallengeProfileWindowDaysOffsetAdjuster implements RegionalChallengeProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RegionalChallengeProfile, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingRegionalChallengeProfileAdjuster implements RegionalChallengeProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalChallengeProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalChallengeProfileAdjuster implements RegionalChallengeProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalChallengeProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalChallengeProfileAdjuster implements RegionalChallengeProfileStep {
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

  adjust(item: RegionalChallengeProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalChallengeProfileAdjuster implements RegionalChallengeProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalChallengeProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional challenge profile steps in order and keeps a trace of each. */
export class RegionalChallengeProfileEngine {
  steps: RegionalChallengeProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalChallengeProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalChallengeProfile): number {
    let current = item.netExposure();
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

  evaluateAll(items: RegionalChallengeProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalChallengeProfileEngine(flagsValue: flags.Registry): RegionalChallengeProfileEngine {
  return new RegionalChallengeProfileEngine(
    [
      new CapRegionalChallengeProfileAdjuster(5178),
      new RegionalChallengeProfileWindowDaysOffsetAdjuster(1.48),
      new RoundingRegionalChallengeProfileAdjuster(0.25),
      new PercentRegionalChallengeProfileAdjuster(-23.5),
      new FlaggedRegionalChallengeProfileAdjuster(flagsValue, "regional-challenge-profile-default", 2.7),
      new MinimumRegionalChallengeProfileAdjuster(35.7),
    ],
    [],
    3.4,
    51744.3,
  );
}
