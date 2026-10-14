import * as flags from "../../../../kit/flags.js";
import { ManualCreditRecord } from "./manual-credit-record.js";

/** One step of the manual credit record calculation. */
export interface ManualCreditRecordModifier {
  describe(): string;
  adjust(item: ManualCreditRecord, value: number): number;
}

export class CapManualCreditRecordAdjuster implements ManualCreditRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualCreditRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedManualCreditRecordAdjuster implements ManualCreditRecordModifier {
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

  adjust(item: ManualCreditRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualCreditRecordAdjuster implements ManualCreditRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualCreditRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual credit record steps in order and keeps a trace of each. */
export class ManualCreditRecordEngine {
  steps: ManualCreditRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualCreditRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualCreditRecord): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ManualCreditRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualCreditRecordEngine(flagsValue: flags.Registry): ManualCreditRecordEngine {
  return new ManualCreditRecordEngine(
    [
      new CapManualCreditRecordAdjuster(28154),
      new FlaggedManualCreditRecordAdjuster(flagsValue, "manual-credit-record-tiered", -4.3),
      new TieredManualCreditRecordAdjuster([6270, 7878], [1.07, 0.87]),
    ],
    [],
    2.1,
    33781.3,
  );
}
