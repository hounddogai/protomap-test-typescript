import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPayoutRecord } from "./primary-payout-record.js";

/** One step of the primary payout record calculation. */
export interface PrimaryPayoutRecordAdjuster {
  describe(): string;
  adjust(item: PrimaryPayoutRecord, value: number): number;
}

export class PercentPrimaryPayoutRecordAdjuster implements PrimaryPayoutRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPayoutRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryPayoutRecordAdjuster implements PrimaryPayoutRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPayoutRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPrimaryPayoutRecordAdjuster implements PrimaryPayoutRecordAdjuster {
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

  adjust(item: PrimaryPayoutRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimaryPayoutRecordAdjuster implements PrimaryPayoutRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryPayoutRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPrimaryPayoutRecordAdjuster implements PrimaryPayoutRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPayoutRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelPrimaryPayoutRecordAdjuster implements PrimaryPayoutRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PrimaryPayoutRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary payout record steps in order and keeps a trace of each. */
export class PrimaryPayoutRecordEngine {
  steps: PrimaryPayoutRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPayoutRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryPayoutRecord): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PrimaryPayoutRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryPayoutRecordEngine(flagsValue: flags.Registry): PrimaryPayoutRecordEngine {
  return new PrimaryPayoutRecordEngine(
    [
      new PercentPrimaryPayoutRecordAdjuster(24),
      new RoundingPrimaryPayoutRecordAdjuster(0.5),
      new FlaggedPrimaryPayoutRecordAdjuster(flagsValue, "primary-payout-record-manual", -2.5),
      new TieredPrimaryPayoutRecordAdjuster([1335, 3064, 3512], [0.95, 1.03, 0.82]),
      new MinimumPrimaryPayoutRecordAdjuster(44.5),
      new ChannelPrimaryPayoutRecordAdjuster(
        new Map<string, number>([["south", 1.38], ["west", 0.9], ["east", 1.33]]),
      ),
    ],
    [],
    0.4,
    18395.2,
  );
}
