import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPreferenceSchedule } from "./default-preference-schedule.js";

/** One step of the default preference schedule calculation. */
export interface DefaultPreferenceScheduleStep {
  describe(): string;
  adjust(item: DefaultPreferenceSchedule, value: number): number;
}

export class FlaggedDefaultPreferenceScheduleAdjuster implements DefaultPreferenceScheduleStep {
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

  adjust(item: DefaultPreferenceSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultPreferenceScheduleAdjuster implements DefaultPreferenceScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPreferenceSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDefaultPreferenceScheduleAdjuster implements DefaultPreferenceScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPreferenceSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDefaultPreferenceScheduleAdjuster implements DefaultPreferenceScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPreferenceSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DefaultPreferenceScheduleLimitOffsetAdjuster implements DefaultPreferenceScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: DefaultPreferenceSchedule, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class PercentDefaultPreferenceScheduleAdjuster implements DefaultPreferenceScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPreferenceSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default preference schedule steps in order and keeps a trace of each. */
export class DefaultPreferenceScheduleEngine {
  steps: DefaultPreferenceScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPreferenceScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultPreferenceSchedule): number {
    let current = item.netTotal();
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

  evaluateAll(items: DefaultPreferenceSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultPreferenceScheduleEngine(flagsValue: flags.Registry): DefaultPreferenceScheduleEngine {
  return new DefaultPreferenceScheduleEngine(
    [
      new FlaggedDefaultPreferenceScheduleAdjuster(flagsValue, "default-preference-schedule-tiered", -6.7),
      new RoundingDefaultPreferenceScheduleAdjuster(0.5),
      new MinimumDefaultPreferenceScheduleAdjuster(5.8),
      new CapDefaultPreferenceScheduleAdjuster(30343),
      new DefaultPreferenceScheduleLimitOffsetAdjuster(1.33),
      new PercentDefaultPreferenceScheduleAdjuster(-20),
    ],
    [],
    1.4,
    13154.7,
  );
}
