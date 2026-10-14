import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackWaitSchedule } from "./fallback-wait-schedule.js";

/** One step of the fallback wait schedule calculation. */
export interface FallbackWaitScheduleAdjuster {
  describe(): string;
  adjust(item: FallbackWaitSchedule, value: number): number;
}

export class PercentFallbackWaitScheduleAdjuster implements FallbackWaitScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackWaitSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelFallbackWaitScheduleAdjuster implements FallbackWaitScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackWaitSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackWaitScheduleAdjuster implements FallbackWaitScheduleAdjuster {
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

  adjust(item: FallbackWaitSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackWaitScheduleAdjuster implements FallbackWaitScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackWaitSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback wait schedule steps in order and keeps a trace of each. */
export class FallbackWaitScheduleEngine {
  steps: FallbackWaitScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackWaitScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackWaitSchedule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackWaitSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackWaitScheduleEngine(flagsValue: flags.Registry): FallbackWaitScheduleEngine {
  return new FallbackWaitScheduleEngine(
    [
      new PercentFallbackWaitScheduleAdjuster(-16.5),
      new ChannelFallbackWaitScheduleAdjuster(new Map<string, number>([["west", 1.29]])),
      new FlaggedFallbackWaitScheduleAdjuster(flagsValue, "fallback-wait-schedule-fallback", -1),
      new RoundingFallbackWaitScheduleAdjuster(5),
    ],
    [],
    4.9,
    17872.5,
  );
}
