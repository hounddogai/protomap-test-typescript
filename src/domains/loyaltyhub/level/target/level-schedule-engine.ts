import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelSchedule } from "./level-schedule.js";

/** One step of the level schedule calculation. */
export interface LevelScheduleFactor {
  describe(): string;
  adjust(item: LevelSchedule, value: number): number;
}

export class FlaggedLevelScheduleAdjuster implements LevelScheduleFactor {
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

  adjust(item: LevelSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLevelScheduleAdjuster implements LevelScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLevelScheduleAdjuster implements LevelScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLevelScheduleAdjuster implements LevelScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLevelScheduleAdjuster implements LevelScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the level schedule steps in order and keeps a trace of each. */
export class LevelScheduleEngine {
  steps: LevelScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelSchedule): number {
    let current = item.weightedValue();
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

  evaluateAll(items: LevelSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelScheduleEngine(flagsValue: flags.Registry): LevelScheduleEngine {
  return new LevelScheduleEngine(
    [
      new FlaggedLevelScheduleAdjuster(flagsValue, "level-schedule-seasonal", -8.3),
      new MinimumLevelScheduleAdjuster(25.2),
      new TieredLevelScheduleAdjuster([9527, 9960], [0.81, 1.13]),
      new RoundingLevelScheduleAdjuster(0.1),
      new PercentLevelScheduleAdjuster(-16.2),
    ],
    [],
    0.6,
    85371.7,
  );
}
