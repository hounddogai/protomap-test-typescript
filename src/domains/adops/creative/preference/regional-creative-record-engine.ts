import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalCreativeRecord } from "./regional-creative-record.js";

/** One step of the regional creative record calculation. */
export interface RegionalCreativeRecordAdjuster {
  describe(): string;
  adjust(item: RegionalCreativeRecord, value: number): number;
}

export class PercentRegionalCreativeRecordAdjuster implements RegionalCreativeRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalCreativeRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalCreativeRecordAdjuster implements RegionalCreativeRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalCreativeRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalCreativeRecordAdjuster implements RegionalCreativeRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalCreativeRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalCreativeRecordAdjuster implements RegionalCreativeRecordAdjuster {
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

  adjust(item: RegionalCreativeRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional creative record steps in order and keeps a trace of each. */
export class RegionalCreativeRecordEngine {
  steps: RegionalCreativeRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCreativeRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalCreativeRecord): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RegionalCreativeRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalCreativeRecordEngine(flagsValue: flags.Registry): RegionalCreativeRecordEngine {
  return new RegionalCreativeRecordEngine(
    [
      new PercentRegionalCreativeRecordAdjuster(11.5),
      new TieredRegionalCreativeRecordAdjuster([3880, 8666], [1.09, 1.02]),
      new RoundingRegionalCreativeRecordAdjuster(0.25),
      new FlaggedRegionalCreativeRecordAdjuster(flagsValue, "regional-creative-record-adaptive", -7.9),
    ],
    [],
    0.9,
    60696,
  );
}
