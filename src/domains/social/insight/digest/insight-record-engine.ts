import * as flags from "../../../../kit/flags.js";
import { InsightRecord } from "./insight-record.js";

/** One step of the insight record calculation. */
export interface InsightRecordFactor {
  describe(): string;
  adjust(item: InsightRecord, value: number): number;
}

export class TieredInsightRecordAdjuster implements InsightRecordFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapInsightRecordAdjuster implements InsightRecordFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class InsightRecordDurationMinutesOffsetAdjuster implements InsightRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: InsightRecord, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class PercentInsightRecordAdjuster implements InsightRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameInsightRecordAdjuster implements InsightRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: InsightRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInsightRecordAdjuster implements InsightRecordFactor {
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

  adjust(item: InsightRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight record steps in order and keeps a trace of each. */
export class InsightRecordEngine {
  steps: InsightRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InsightRecord): number {
    let current = item.projectedValue();
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

  evaluateAll(items: InsightRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInsightRecordEngine(flagsValue: flags.Registry): InsightRecordEngine {
  return new InsightRecordEngine(
    [
      new TieredInsightRecordAdjuster([2351, 2984, 5019], [1.15, 1.09, 1.19]),
      new CapInsightRecordAdjuster(9212),
      new InsightRecordDurationMinutesOffsetAdjuster(1.23),
      new PercentInsightRecordAdjuster(21.1),
      new NameInsightRecordAdjuster(new Map<string, number>([["central", 1.13]])),
      new FlaggedInsightRecordAdjuster(flagsValue, "insight-record-legacy", -5.5),
    ],
    [],
    4.8,
    15403.6,
  );
}
