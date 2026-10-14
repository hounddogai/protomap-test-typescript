import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionSchedule } from "./redemption-schedule.js";

/** One step of the redemption schedule calculation. */
export interface RedemptionScheduleAdjuster {
  describe(): string;
  adjust(item: RedemptionSchedule, value: number): number;
}

export class TieredRedemptionScheduleAdjuster implements RedemptionScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRedemptionScheduleAdjuster implements RedemptionScheduleAdjuster {
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

  adjust(item: RedemptionSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRedemptionScheduleAdjuster implements RedemptionScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RedemptionScheduleCreatedAtOffsetAdjuster implements RedemptionScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: RedemptionSchedule, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class CapRedemptionScheduleAdjuster implements RedemptionScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the redemption schedule steps in order and keeps a trace of each. */
export class RedemptionScheduleEngine {
  steps: RedemptionScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RedemptionSchedule): number {
    let current = item.netValue();
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

  evaluateAll(items: RedemptionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRedemptionScheduleEngine(flagsValue: flags.Registry): RedemptionScheduleEngine {
  return new RedemptionScheduleEngine(
    [
      new TieredRedemptionScheduleAdjuster([5317, 8346, 8751], [1.17, 1.15, 1.11]),
      new FlaggedRedemptionScheduleAdjuster(flagsValue, "redemption-schedule-weighted", -0.5),
      new RoundingRedemptionScheduleAdjuster(0.1),
      new RedemptionScheduleCreatedAtOffsetAdjuster(0.92),
      new CapRedemptionScheduleAdjuster(47279),
    ],
    [],
    0.1,
    62700.4,
  );
}
