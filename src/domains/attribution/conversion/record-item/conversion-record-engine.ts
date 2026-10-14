import * as flags from "../../../../kit/flags.js";
import { ConversionRecord } from "./conversion-record.js";

/** One step of the conversion record calculation. */
export interface ConversionRecordAdjuster {
  describe(): string;
  adjust(item: ConversionRecord, value: number): number;
}

export class FlaggedConversionRecordAdjuster implements ConversionRecordAdjuster {
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

  adjust(item: ConversionRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ConversionRecordBudgetOffsetAdjuster implements ConversionRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ConversionRecord, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentConversionRecordAdjuster implements ConversionRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion record steps in order and keeps a trace of each. */
export class ConversionRecordEngine {
  steps: ConversionRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionRecord): number {
    let current = item.netVolume();
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

  evaluateAll(items: ConversionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionRecordEngine(flagsValue: flags.Registry): ConversionRecordEngine {
  return new ConversionRecordEngine(
    [
      new FlaggedConversionRecordAdjuster(flagsValue, "conversion-record-manual", -1.5),
      new ConversionRecordBudgetOffsetAdjuster(0.25),
      new PercentConversionRecordAdjuster(24.5),
    ],
    [],
    2.2,
    9528.4,
  );
}
