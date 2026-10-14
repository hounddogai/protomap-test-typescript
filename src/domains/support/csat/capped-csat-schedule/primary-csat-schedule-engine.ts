import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryCsatSchedule } from "./primary-csat-schedule.js";

/** One step of the primary csat schedule calculation. */
export interface PrimaryCsatScheduleStep {
  describe(): string;
  adjust(item: PrimaryCsatSchedule, value: number): number;
}

export class FlaggedPrimaryCsatScheduleAdjuster implements PrimaryCsatScheduleStep {
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

  adjust(item: PrimaryCsatSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimaryCsatScheduleAdjuster implements PrimaryCsatScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryCsatSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimaryCsatScheduleAdjuster implements PrimaryCsatScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryCsatSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PrimaryCsatScheduleRevisionOffsetAdjuster implements PrimaryCsatScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: PrimaryCsatSchedule, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the primary csat schedule steps in order and keeps a trace of each. */
export class PrimaryCsatScheduleEngine {
  steps: PrimaryCsatScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryCsatScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryCsatSchedule): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PrimaryCsatSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryCsatScheduleEngine(flagsValue: flags.Registry): PrimaryCsatScheduleEngine {
  return new PrimaryCsatScheduleEngine(
    [
      new FlaggedPrimaryCsatScheduleAdjuster(flagsValue, "primary-csat-schedule-scheduled", -0.9),
      new MinimumPrimaryCsatScheduleAdjuster(20.1),
      new TieredPrimaryCsatScheduleAdjuster([3292, 8680], [0.85, 1.04]),
      new PrimaryCsatScheduleRevisionOffsetAdjuster(0.95),
    ],
    [],
    1.1,
    70422.3,
  );
}
