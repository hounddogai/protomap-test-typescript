import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFrequencyAdjustment } from "./scheduled-frequency-adjustment.js";

/** One step of the scheduled frequency adjustment calculation. */
export interface ScheduledFrequencyAdjustmentFactor {
  describe(): string;
  adjust(item: ScheduledFrequencyAdjustment, value: number): number;
}

export class CapScheduledFrequencyAdjustmentAdjuster implements ScheduledFrequencyAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFrequencyAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledFrequencyAdjustmentAdjuster implements ScheduledFrequencyAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledFrequencyAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledFrequencyAdjustmentAdjuster implements ScheduledFrequencyAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFrequencyAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedScheduledFrequencyAdjustmentAdjuster implements ScheduledFrequencyAdjustmentFactor {
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

  adjust(item: ScheduledFrequencyAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled frequency adjustment steps in order and keeps a trace of each. */
export class ScheduledFrequencyAdjustmentEngine {
  steps: ScheduledFrequencyAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFrequencyAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledFrequencyAdjustment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ScheduledFrequencyAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledFrequencyAdjustmentEngine(flagsValue: flags.Registry): ScheduledFrequencyAdjustmentEngine {
  return new ScheduledFrequencyAdjustmentEngine(
    [
      new CapScheduledFrequencyAdjustmentAdjuster(46275),
      new MinimumScheduledFrequencyAdjustmentAdjuster(8.5),
      new RoundingScheduledFrequencyAdjustmentAdjuster(0.25),
      new FlaggedScheduledFrequencyAdjustmentAdjuster(flagsValue, "scheduled-frequency-adjustment-manual", -4),
    ],
    [],
    0.8,
    37825.3,
  );
}
