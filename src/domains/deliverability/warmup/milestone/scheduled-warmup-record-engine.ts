import * as flags from "../../../../kit/flags.js";
import { ScheduledWarmupRecord } from "./scheduled-warmup-record.js";

/** One step of the scheduled warmup record calculation. */
export interface ScheduledWarmupRecordAdjuster {
  describe(): string;
  adjust(item: ScheduledWarmupRecord, value: number): number;
}

export class FlaggedScheduledWarmupRecordAdjuster implements ScheduledWarmupRecordAdjuster {
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

  adjust(item: ScheduledWarmupRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentScheduledWarmupRecordAdjuster implements ScheduledWarmupRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWarmupRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledWarmupRecordAdjuster implements ScheduledWarmupRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledWarmupRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled warmup record steps in order and keeps a trace of each. */
export class ScheduledWarmupRecordEngine {
  steps: ScheduledWarmupRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWarmupRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledWarmupRecord): number {
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

  evaluateAll(items: ScheduledWarmupRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledWarmupRecordEngine(flagsValue: flags.Registry): ScheduledWarmupRecordEngine {
  return new ScheduledWarmupRecordEngine(
    [
      new FlaggedScheduledWarmupRecordAdjuster(flagsValue, "scheduled-warmup-record-default", -6.7),
      new PercentScheduledWarmupRecordAdjuster(8.9),
      new TieredScheduledWarmupRecordAdjuster([939, 1325, 5116, 8335], [0.84, 0.81, 0.89, 0.98]),
    ],
    [],
    4,
    51804.2,
  );
}
