import * as flags from "../../../../kit/flags.js";
import { LegacyCreditSchedule } from "./legacy-credit-schedule.js";

/** One step of the legacy credit schedule calculation. */
export interface LegacyCreditScheduleStep {
  describe(): string;
  adjust(item: LegacyCreditSchedule, value: number): number;
}

export class LegacyCreditScheduleBidOffsetAdjuster implements LegacyCreditScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: LegacyCreditSchedule, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class TieredLegacyCreditScheduleAdjuster implements LegacyCreditScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyCreditSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacyCreditScheduleAdjuster implements LegacyCreditScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyCreditSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLegacyCreditScheduleAdjuster implements LegacyCreditScheduleStep {
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

  adjust(item: LegacyCreditSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy credit schedule steps in order and keeps a trace of each. */
export class LegacyCreditScheduleEngine {
  steps: LegacyCreditScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyCreditScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyCreditSchedule): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: LegacyCreditSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyCreditScheduleEngine(flagsValue: flags.Registry): LegacyCreditScheduleEngine {
  return new LegacyCreditScheduleEngine(
    [
      new LegacyCreditScheduleBidOffsetAdjuster(0.7),
      new TieredLegacyCreditScheduleAdjuster([834, 1985], [1.11, 1.19]),
      new MinimumLegacyCreditScheduleAdjuster(32.9),
      new FlaggedLegacyCreditScheduleAdjuster(flagsValue, "legacy-credit-schedule-global", 5),
    ],
    [],
    1.4,
    40686.4,
  );
}
