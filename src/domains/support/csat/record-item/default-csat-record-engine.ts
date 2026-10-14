import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultCsatRecord } from "./default-csat-record.js";

/** One step of the default csat record calculation. */
export interface DefaultCsatRecordModifier {
  describe(): string;
  adjust(item: DefaultCsatRecord, value: number): number;
}

export class FlaggedDefaultCsatRecordAdjuster implements DefaultCsatRecordModifier {
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

  adjust(item: DefaultCsatRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultCsatRecordAdjuster implements DefaultCsatRecordModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultCsatRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultCsatRecordAdjuster implements DefaultCsatRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultCsatRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultCsatRecordAdjuster implements DefaultCsatRecordModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultCsatRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default csat record steps in order and keeps a trace of each. */
export class DefaultCsatRecordEngine {
  steps: DefaultCsatRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultCsatRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultCsatRecord): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DefaultCsatRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultCsatRecordEngine(flagsValue: flags.Registry): DefaultCsatRecordEngine {
  return new DefaultCsatRecordEngine(
    [
      new FlaggedDefaultCsatRecordAdjuster(flagsValue, "default-csat-record-strict", 5.2),
      new PercentDefaultCsatRecordAdjuster(12.7),
      new CapDefaultCsatRecordAdjuster(46661),
      new RoundingDefaultCsatRecordAdjuster(0.25),
    ],
    [],
    3,
    9954.4,
  );
}
