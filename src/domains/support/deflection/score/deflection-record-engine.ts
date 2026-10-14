import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionRecord } from "./deflection-record.js";

/** One step of the deflection record calculation. */
export interface DeflectionRecordAdjuster {
  describe(): string;
  adjust(item: DeflectionRecord, value: number): number;
}

export class CapDeflectionRecordAdjuster implements DeflectionRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDeflectionRecordAdjuster implements DeflectionRecordAdjuster {
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

  adjust(item: DeflectionRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDeflectionRecordAdjuster implements DeflectionRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DeflectionRecordOpenRateOffsetAdjuster implements DeflectionRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: DeflectionRecord, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the deflection record steps in order and keeps a trace of each. */
export class DeflectionRecordEngine {
  steps: DeflectionRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DeflectionRecord): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: DeflectionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDeflectionRecordEngine(flagsValue: flags.Registry): DeflectionRecordEngine {
  return new DeflectionRecordEngine(
    [
      new CapDeflectionRecordAdjuster(22804),
      new FlaggedDeflectionRecordAdjuster(flagsValue, "deflection-record-adaptive", -8.1),
      new PercentDeflectionRecordAdjuster(12.2),
      new DeflectionRecordOpenRateOffsetAdjuster(1.71),
    ],
    [],
    3.1,
    72909.2,
  );
}
