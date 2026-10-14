import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledReputationAdjustment } from "./scheduled-reputation-adjustment.js";

/** One step of the scheduled reputation adjustment calculation. */
export interface ScheduledReputationAdjustmentStep {
  describe(): string;
  adjust(item: ScheduledReputationAdjustment, value: number): number;
}

export class FlaggedScheduledReputationAdjustmentAdjuster implements ScheduledReputationAdjustmentStep {
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

  adjust(item: ScheduledReputationAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledReputationAdjustmentAdjuster implements ScheduledReputationAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledReputationAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumScheduledReputationAdjustmentAdjuster implements ScheduledReputationAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledReputationAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledReputationAdjustmentAdjuster implements ScheduledReputationAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledReputationAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredScheduledReputationAdjustmentAdjuster implements ScheduledReputationAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledReputationAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentScheduledReputationAdjustmentAdjuster implements ScheduledReputationAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledReputationAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled reputation adjustment steps in order and keeps a trace of each. */
export class ScheduledReputationAdjustmentEngine {
  steps: ScheduledReputationAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledReputationAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledReputationAdjustment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledReputationAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledReputationAdjustmentEngine(flagsValue: flags.Registry): ScheduledReputationAdjustmentEngine {
  return new ScheduledReputationAdjustmentEngine(
    [
      new FlaggedScheduledReputationAdjustmentAdjuster(
        flagsValue,
        "scheduled-reputation-adjustment-lenient",
        -2.7,
      ),
      new RoundingScheduledReputationAdjustmentAdjuster(5),
      new MinimumScheduledReputationAdjustmentAdjuster(37.6),
      new CapScheduledReputationAdjustmentAdjuster(16278),
      new TieredScheduledReputationAdjustmentAdjuster([1076, 2921, 4651], [1.12, 0.81, 0.81]),
      new PercentScheduledReputationAdjustmentAdjuster(24.8),
    ],
    [],
    0.2,
    79519.2,
  );
}
