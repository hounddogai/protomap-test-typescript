import * as flags from "../../../../kit/flags.js";
import { WaitSchedule } from "./wait-schedule.js";

/** One step of the wait schedule calculation. */
export interface WaitScheduleAdjuster {
  describe(): string;
  adjust(item: WaitSchedule, value: number): number;
}

export class UtmSourceWaitScheduleAdjuster implements WaitScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: WaitSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWaitScheduleAdjuster implements WaitScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWaitScheduleAdjuster implements WaitScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWaitScheduleAdjuster implements WaitScheduleAdjuster {
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

  adjust(item: WaitSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WaitScheduleVersionOffsetAdjuster implements WaitScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: WaitSchedule, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the wait schedule steps in order and keeps a trace of each. */
export class WaitScheduleEngine {
  steps: WaitScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WaitSchedule): number {
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

  evaluateAll(items: WaitSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWaitScheduleEngine(flagsValue: flags.Registry): WaitScheduleEngine {
  return new WaitScheduleEngine(
    [
      new UtmSourceWaitScheduleAdjuster(
        new Map<string, number>([["online", 1.38], ["retail", 0.88], ["south", 1.22]]),
      ),
      new TieredWaitScheduleAdjuster([1990, 3916, 4888, 9033], [1.07, 0.95, 0.92, 0.82]),
      new MinimumWaitScheduleAdjuster(32),
      new FlaggedWaitScheduleAdjuster(flagsValue, "wait-schedule-weighted", 6.2),
      new WaitScheduleVersionOffsetAdjuster(0.03),
    ],
    [],
    4.9,
    82003.9,
  );
}
