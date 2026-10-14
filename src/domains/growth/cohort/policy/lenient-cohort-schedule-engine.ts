import * as flags from "../../../../kit/flags.js";
import { LenientCohortSchedule } from "./lenient-cohort-schedule.js";

/** One step of the lenient cohort schedule calculation. */
export interface LenientCohortScheduleAdjuster {
  describe(): string;
  adjust(item: LenientCohortSchedule, value: number): number;
}

export class MinimumLenientCohortScheduleAdjuster implements LenientCohortScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientCohortSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientCohortScheduleAdjuster implements LenientCohortScheduleAdjuster {
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

  adjust(item: LenientCohortSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientCohortScheduleAdjuster implements LenientCohortScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientCohortSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient cohort schedule steps in order and keeps a trace of each. */
export class LenientCohortScheduleEngine {
  steps: LenientCohortScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCohortScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientCohortSchedule): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LenientCohortSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientCohortScheduleEngine(flagsValue: flags.Registry): LenientCohortScheduleEngine {
  return new LenientCohortScheduleEngine(
    [
      new MinimumLenientCohortScheduleAdjuster(11.2),
      new FlaggedLenientCohortScheduleAdjuster(flagsValue, "lenient-cohort-schedule-fallback", -1.7),
      new PercentLenientCohortScheduleAdjuster(-16.6),
    ],
    [],
    3,
    37761.3,
  );
}
