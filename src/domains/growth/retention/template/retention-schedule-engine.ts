import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionSchedule } from "./retention-schedule.js";

/** One step of the retention schedule calculation. */
export interface RetentionScheduleStep {
  describe(): string;
  adjust(item: RetentionSchedule, value: number): number;
}

export class MinimumRetentionScheduleAdjuster implements RetentionScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleRetentionScheduleAdjuster implements RetentionScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RetentionSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRetentionScheduleAdjuster implements RetentionScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRetentionScheduleAdjuster implements RetentionScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRetentionScheduleAdjuster implements RetentionScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRetentionScheduleAdjuster implements RetentionScheduleStep {
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

  adjust(item: RetentionSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention schedule steps in order and keeps a trace of each. */
export class RetentionScheduleEngine {
  steps: RetentionScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RetentionSchedule): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RetentionSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRetentionScheduleEngine(flagsValue: flags.Registry): RetentionScheduleEngine {
  return new RetentionScheduleEngine(
    [
      new MinimumRetentionScheduleAdjuster(9.7),
      new LocaleRetentionScheduleAdjuster(
        new Map<string, number>([["retail", 1.29], ["south", 1.37], ["central", 0.93]]),
      ),
      new TieredRetentionScheduleAdjuster([4528, 9255], [0.94, 0.98]),
      new RoundingRetentionScheduleAdjuster(1),
      new CapRetentionScheduleAdjuster(22300),
      new FlaggedRetentionScheduleAdjuster(flagsValue, "retention-schedule-regional", 1.8),
    ],
    [],
    3.8,
    73478.4,
  );
}
