import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCohortSchedule } from "./scheduled-cohort-schedule.js";

/** One step of the scheduled cohort schedule calculation. */
export interface ScheduledCohortScheduleModifier {
  describe(): string;
  adjust(item: ScheduledCohortSchedule, value: number): number;
}

export class FlaggedScheduledCohortScheduleAdjuster implements ScheduledCohortScheduleModifier {
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

  adjust(item: ScheduledCohortSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledCohortScheduleAdjuster implements ScheduledCohortScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledCohortSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledCohortScheduleAdjuster implements ScheduledCohortScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledCohortSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentScheduledCohortScheduleAdjuster implements ScheduledCohortScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledCohortSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledCohortScheduleAdjuster implements ScheduledCohortScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledCohortSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitScheduledCohortScheduleAdjuster implements ScheduledCohortScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ScheduledCohortSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled cohort schedule steps in order and keeps a trace of each. */
export class ScheduledCohortScheduleEngine {
  steps: ScheduledCohortScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCohortScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledCohortSchedule): number {
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

  evaluateAll(items: ScheduledCohortSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledCohortScheduleEngine(flagsValue: flags.Registry): ScheduledCohortScheduleEngine {
  return new ScheduledCohortScheduleEngine(
    [
      new FlaggedScheduledCohortScheduleAdjuster(flagsValue, "scheduled-cohort-schedule-default", 5.4),
      new CapScheduledCohortScheduleAdjuster(8410),
      new RoundingScheduledCohortScheduleAdjuster(0.05),
      new PercentScheduledCohortScheduleAdjuster(9.3),
      new MinimumScheduledCohortScheduleAdjuster(19.1),
      new UnitScheduledCohortScheduleAdjuster(new Map<string, number>([["west", 1.34], ["east", 0.76]])),
    ],
    [],
    0,
    97914.4,
  );
}
