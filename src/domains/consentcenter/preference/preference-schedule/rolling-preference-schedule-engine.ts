import * as flags from "../../../../kit/flags.js";
import { RollingPreferenceSchedule } from "./rolling-preference-schedule.js";

/** One step of the rolling preference schedule calculation. */
export interface RollingPreferenceScheduleModifier {
  describe(): string;
  adjust(item: RollingPreferenceSchedule, value: number): number;
}

export class CapRollingPreferenceScheduleAdjuster implements RollingPreferenceScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingPreferenceSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRollingPreferenceScheduleAdjuster implements RollingPreferenceScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPreferenceSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameRollingPreferenceScheduleAdjuster implements RollingPreferenceScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingPreferenceSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingPreferenceScheduleAdjuster implements RollingPreferenceScheduleModifier {
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

  adjust(item: RollingPreferenceSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingPreferenceScheduleAdjuster implements RollingPreferenceScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingPreferenceSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling preference schedule steps in order and keeps a trace of each. */
export class RollingPreferenceScheduleEngine {
  steps: RollingPreferenceScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPreferenceScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingPreferenceSchedule): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RollingPreferenceSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingPreferenceScheduleEngine(flagsValue: flags.Registry): RollingPreferenceScheduleEngine {
  return new RollingPreferenceScheduleEngine(
    [
      new CapRollingPreferenceScheduleAdjuster(41936),
      new PercentRollingPreferenceScheduleAdjuster(16.2),
      new NameRollingPreferenceScheduleAdjuster(new Map<string, number>([["east", 1.23], ["south", 1.37]])),
      new FlaggedRollingPreferenceScheduleAdjuster(flagsValue, "rolling-preference-schedule-capped", -3.8),
      new MinimumRollingPreferenceScheduleAdjuster(16.1),
    ],
    [],
    3.7,
    9853,
  );
}
