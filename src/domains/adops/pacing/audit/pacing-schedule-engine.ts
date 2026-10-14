import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingSchedule } from "./pacing-schedule.js";

/** One step of the pacing schedule calculation. */
export interface PacingScheduleFactor {
  describe(): string;
  adjust(item: PacingSchedule, value: number): number;
}

export class PercentPacingScheduleAdjuster implements PacingScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPacingScheduleAdjuster implements PacingScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPacingScheduleAdjuster implements PacingScheduleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPacingScheduleAdjuster implements PacingScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PacingScheduleConversionRateOffsetAdjuster implements PacingScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: PacingSchedule, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class FlaggedPacingScheduleAdjuster implements PacingScheduleFactor {
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

  adjust(item: PacingSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pacing schedule steps in order and keeps a trace of each. */
export class PacingScheduleEngine {
  steps: PacingScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PacingSchedule): number {
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

  evaluateAll(items: PacingSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPacingScheduleEngine(flagsValue: flags.Registry): PacingScheduleEngine {
  return new PacingScheduleEngine(
    [
      new PercentPacingScheduleAdjuster(-9.7),
      new MinimumPacingScheduleAdjuster(39.7),
      new CapPacingScheduleAdjuster(38799),
      new RoundingPacingScheduleAdjuster(0.1),
      new PacingScheduleConversionRateOffsetAdjuster(1.61),
      new FlaggedPacingScheduleAdjuster(flagsValue, "pacing-schedule-scheduled", -1.7),
    ],
    [],
    0.5,
    57157.2,
  );
}
