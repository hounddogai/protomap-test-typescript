import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictModelRecord } from "./strict-model-record.js";

/** One step of the strict model record calculation. */
export interface StrictModelRecordFactor {
  describe(): string;
  adjust(item: StrictModelRecord, value: number): number;
}

export class TieredStrictModelRecordAdjuster implements StrictModelRecordFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictModelRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StrictModelRecordQuantityOffsetAdjuster implements StrictModelRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: StrictModelRecord, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedStrictModelRecordAdjuster implements StrictModelRecordFactor {
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

  adjust(item: StrictModelRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStrictModelRecordAdjuster implements StrictModelRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictModelRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict model record steps in order and keeps a trace of each. */
export class StrictModelRecordEngine {
  steps: StrictModelRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictModelRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictModelRecord): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StrictModelRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictModelRecordEngine(flagsValue: flags.Registry): StrictModelRecordEngine {
  return new StrictModelRecordEngine(
    [
      new TieredStrictModelRecordAdjuster([8062, 8321], [1.19, 1.05]),
      new StrictModelRecordQuantityOffsetAdjuster(1.47),
      new FlaggedStrictModelRecordAdjuster(flagsValue, "strict-model-record-manual", -4.2),
      new PercentStrictModelRecordAdjuster(-15.2),
    ],
    [],
    2.3,
    27970.3,
  );
}
