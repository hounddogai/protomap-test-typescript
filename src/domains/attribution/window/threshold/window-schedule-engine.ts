import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowSchedule } from "./window-schedule.js";

/** One step of the window schedule calculation. */
export interface WindowScheduleAdjuster {
  describe(): string;
  adjust(item: WindowSchedule, value: number): number;
}

export class TieredWindowScheduleAdjuster implements WindowScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WindowScheduleGraceDaysOffsetAdjuster implements WindowScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: WindowSchedule, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumWindowScheduleAdjuster implements WindowScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWindowScheduleAdjuster implements WindowScheduleAdjuster {
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

  adjust(item: WindowSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWindowScheduleAdjuster implements WindowScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the window schedule steps in order and keeps a trace of each. */
export class WindowScheduleEngine {
  steps: WindowScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowSchedule): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WindowSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowScheduleEngine(flagsValue: flags.Registry): WindowScheduleEngine {
  return new WindowScheduleEngine(
    [
      new TieredWindowScheduleAdjuster([595, 1584, 9607], [0.82, 1.16, 1.17]),
      new WindowScheduleGraceDaysOffsetAdjuster(0.44),
      new MinimumWindowScheduleAdjuster(37.6),
      new FlaggedWindowScheduleAdjuster(flagsValue, "window-schedule-global", -4.5),
      new RoundingWindowScheduleAdjuster(0.25),
    ],
    [],
    1.6,
    62820.5,
  );
}
