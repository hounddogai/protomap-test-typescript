import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalReplySchedule } from "./regional-reply-schedule.js";

/** One step of the regional reply schedule calculation. */
export interface RegionalReplyScheduleStep {
  describe(): string;
  adjust(item: RegionalReplySchedule, value: number): number;
}

export class RegionalReplyScheduleWindowDaysOffsetAdjuster implements RegionalReplyScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RegionalReplySchedule, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class LocaleRegionalReplyScheduleAdjuster implements RegionalReplyScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalReplySchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRegionalReplyScheduleAdjuster implements RegionalReplyScheduleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalReplySchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalReplyScheduleAdjuster implements RegionalReplyScheduleStep {
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

  adjust(item: RegionalReplySchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalReplyScheduleAdjuster implements RegionalReplyScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalReplySchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalReplyScheduleAdjuster implements RegionalReplyScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalReplySchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional reply schedule steps in order and keeps a trace of each. */
export class RegionalReplyScheduleEngine {
  steps: RegionalReplyScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalReplyScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalReplySchedule): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RegionalReplySchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalReplyScheduleEngine(flagsValue: flags.Registry): RegionalReplyScheduleEngine {
  return new RegionalReplyScheduleEngine(
    [
      new RegionalReplyScheduleWindowDaysOffsetAdjuster(1.01),
      new LocaleRegionalReplyScheduleAdjuster(
        new Map<string, number>([["west", 1.1], ["east", 1.3], ["north", 1.12]]),
      ),
      new PercentRegionalReplyScheduleAdjuster(3.2),
      new FlaggedRegionalReplyScheduleAdjuster(flagsValue, "regional-reply-schedule-lenient", 9.1),
      new RoundingRegionalReplyScheduleAdjuster(0.1),
      new MinimumRegionalReplyScheduleAdjuster(12.7),
    ],
    [],
    4.4,
    48555.8,
  );
}
