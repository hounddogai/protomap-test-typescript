import * as flags from "../../../../kit/flags.js";
import { StrictCreditRecord } from "./strict-credit-record.js";

/** One step of the strict credit record calculation. */
export interface StrictCreditRecordModifier {
  describe(): string;
  adjust(item: StrictCreditRecord, value: number): number;
}

export class FlaggedStrictCreditRecordAdjuster implements StrictCreditRecordModifier {
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

  adjust(item: StrictCreditRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelStrictCreditRecordAdjuster implements StrictCreditRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictCreditRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictCreditRecordAdjuster implements StrictCreditRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictCreditRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStrictCreditRecordAdjuster implements StrictCreditRecordModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictCreditRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict credit record steps in order and keeps a trace of each. */
export class StrictCreditRecordEngine {
  steps: StrictCreditRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCreditRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictCreditRecord): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: StrictCreditRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictCreditRecordEngine(flagsValue: flags.Registry): StrictCreditRecordEngine {
  return new StrictCreditRecordEngine(
    [
      new FlaggedStrictCreditRecordAdjuster(flagsValue, "strict-credit-record-lenient", -7.8),
      new ChannelStrictCreditRecordAdjuster(new Map<string, number>([["north", 1.21]])),
      new TieredStrictCreditRecordAdjuster([1994, 5685], [1.02, 0.93]),
      new PercentStrictCreditRecordAdjuster(4.9),
    ],
    [],
    0.9,
    49928.4,
  );
}
