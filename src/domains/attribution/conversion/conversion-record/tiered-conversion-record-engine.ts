import * as flags from "../../../../kit/flags.js";
import { TieredConversionRecord } from "./tiered-conversion-record.js";

/** One step of the tiered conversion record calculation. */
export interface TieredConversionRecordStep {
  describe(): string;
  adjust(item: TieredConversionRecord, value: number): number;
}

export class MinimumTieredConversionRecordAdjuster implements TieredConversionRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredConversionRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredConversionRecordAdjuster implements TieredConversionRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredConversionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredConversionRecordAdjuster implements TieredConversionRecordStep {
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

  adjust(item: TieredConversionRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentTieredConversionRecordAdjuster implements TieredConversionRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TieredConversionRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredConversionRecordUpdatedAtOffsetAdjuster implements TieredConversionRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: TieredConversionRecord, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the tiered conversion record steps in order and keeps a trace of each. */
export class TieredConversionRecordEngine {
  steps: TieredConversionRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredConversionRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredConversionRecord): number {
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

  evaluateAll(items: TieredConversionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredConversionRecordEngine(flagsValue: flags.Registry): TieredConversionRecordEngine {
  return new TieredConversionRecordEngine(
    [
      new MinimumTieredConversionRecordAdjuster(9.1),
      new PercentTieredConversionRecordAdjuster(-23.1),
      new FlaggedTieredConversionRecordAdjuster(flagsValue, "tiered-conversion-record-legacy", -1.8),
      new SegmentTieredConversionRecordAdjuster(new Map<string, number>([["east", 1.05]])),
      new TieredConversionRecordUpdatedAtOffsetAdjuster(0.06),
    ],
    [],
    0.6,
    52012.7,
  );
}
