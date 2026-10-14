import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingFrequencyRecord } from "./rolling-frequency-record.js";

/** One step of the rolling frequency record calculation. */
export interface RollingFrequencyRecordAdjuster {
  describe(): string;
  adjust(item: RollingFrequencyRecord, value: number): number;
}

export class RollingFrequencyRecordQuantityOffsetAdjuster implements RollingFrequencyRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RollingFrequencyRecord, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredRollingFrequencyRecordAdjuster implements RollingFrequencyRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingFrequencyRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingFrequencyRecordAdjuster implements RollingFrequencyRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingFrequencyRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRollingFrequencyRecordAdjuster implements RollingFrequencyRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingFrequencyRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingFrequencyRecordAdjuster implements RollingFrequencyRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingFrequencyRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRollingFrequencyRecordAdjuster implements RollingFrequencyRecordAdjuster {
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

  adjust(item: RollingFrequencyRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling frequency record steps in order and keeps a trace of each. */
export class RollingFrequencyRecordEngine {
  steps: RollingFrequencyRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFrequencyRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingFrequencyRecord): number {
    let current = item.netValue();
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

  evaluateAll(items: RollingFrequencyRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingFrequencyRecordEngine(flagsValue: flags.Registry): RollingFrequencyRecordEngine {
  return new RollingFrequencyRecordEngine(
    [
      new RollingFrequencyRecordQuantityOffsetAdjuster(0.84),
      new TieredRollingFrequencyRecordAdjuster([5583, 6564, 7987], [1.12, 0.82, 0.9]),
      new CapRollingFrequencyRecordAdjuster(4150),
      new PercentRollingFrequencyRecordAdjuster(22.6),
      new RoundingRollingFrequencyRecordAdjuster(0.25),
      new FlaggedRollingFrequencyRecordAdjuster(flagsValue, "rolling-frequency-record-capped", -0.3),
    ],
    [],
    4.4,
    36271.4,
  );
}
