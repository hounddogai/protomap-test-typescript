import * as flags from "../../../../kit/flags.js";
import { StreakProfile } from "./streak-profile.js";

/** One step of the streak profile calculation. */
export interface StreakProfileStep {
  describe(): string;
  adjust(item: StreakProfile, value: number): number;
}

export class StreakProfileWeightOffsetAdjuster implements StreakProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: StreakProfile, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class FlaggedStreakProfileAdjuster implements StreakProfileStep {
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

  adjust(item: StreakProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakProfileAdjuster implements StreakProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStreakProfileAdjuster implements StreakProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the streak profile steps in order and keeps a trace of each. */
export class StreakProfileEngine {
  steps: StreakProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakProfile): number {
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

  evaluateAll(items: StreakProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakProfileEngine(flagsValue: flags.Registry): StreakProfileEngine {
  return new StreakProfileEngine(
    [
      new StreakProfileWeightOffsetAdjuster(1.82),
      new FlaggedStreakProfileAdjuster(flagsValue, "streak-profile-primary", -9.6),
      new CapStreakProfileAdjuster(9740),
      new PercentStreakProfileAdjuster(22.3),
    ],
    [],
    3.6,
    49516.6,
  );
}
