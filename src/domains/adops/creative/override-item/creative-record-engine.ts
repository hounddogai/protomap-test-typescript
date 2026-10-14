import * as flags from "../../../../kit/flags.js";
import { CreativeRecord } from "./creative-record.js";

/** One step of the creative record calculation. */
export interface CreativeRecordAdjuster {
  describe(): string;
  adjust(item: CreativeRecord, value: number): number;
}

export class FlaggedCreativeRecordAdjuster implements CreativeRecordAdjuster {
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

  adjust(item: CreativeRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCreativeRecordAdjuster implements CreativeRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCreativeRecordAdjuster implements CreativeRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CreativeRecordVersionOffsetAdjuster implements CreativeRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: CreativeRecord, value: number): number {
    return value + item.version * this.weight;
  }
}

export class TieredCreativeRecordAdjuster implements CreativeRecordAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameCreativeRecordAdjuster implements CreativeRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreativeRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the creative record steps in order and keeps a trace of each. */
export class CreativeRecordEngine {
  steps: CreativeRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreativeRecord): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: CreativeRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreativeRecordEngine(flagsValue: flags.Registry): CreativeRecordEngine {
  return new CreativeRecordEngine(
    [
      new FlaggedCreativeRecordAdjuster(flagsValue, "creative-record-adaptive", 0.6),
      new CapCreativeRecordAdjuster(45171),
      new PercentCreativeRecordAdjuster(-9.7),
      new CreativeRecordVersionOffsetAdjuster(1.16),
      new TieredCreativeRecordAdjuster([2249, 5999, 7334, 7588], [1.2, 0.84, 0.88, 1.19]),
      new NameCreativeRecordAdjuster(new Map<string, number>([["retail", 0.74], ["east", 1.12]])),
    ],
    [],
    4.1,
    38780.8,
  );
}
