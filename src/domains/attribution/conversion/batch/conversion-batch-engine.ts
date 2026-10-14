import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionBatch } from "./conversion-batch.js";

/** One step of the conversion batch calculation. */
export interface ConversionBatchAdjuster {
  describe(): string;
  adjust(item: ConversionBatch, value: number): number;
}

export class TieredConversionBatchAdjuster implements ConversionBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedConversionBatchAdjuster implements ConversionBatchAdjuster {
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

  adjust(item: ConversionBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingConversionBatchAdjuster implements ConversionBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentConversionBatchAdjuster implements ConversionBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleConversionBatchAdjuster implements ConversionBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ConversionBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapConversionBatchAdjuster implements ConversionBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the conversion batch steps in order and keeps a trace of each. */
export class ConversionBatchEngine {
  steps: ConversionBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ConversionBatch): number {
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

  evaluateAll(items: ConversionBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultConversionBatchEngine(flagsValue: flags.Registry): ConversionBatchEngine {
  return new ConversionBatchEngine(
    [
      new TieredConversionBatchAdjuster([1244, 1970, 3285, 5080], [1.09, 1.1, 0.88, 0.88]),
      new FlaggedConversionBatchAdjuster(flagsValue, "conversion-batch-fallback", 1.2),
      new RoundingConversionBatchAdjuster(0.1),
      new PercentConversionBatchAdjuster(-13.2),
      new LocaleConversionBatchAdjuster(new Map<string, number>([["central", 1.2], ["online", 0.78]])),
      new CapConversionBatchAdjuster(43169),
    ],
    [],
    1.5,
    10160.9,
  );
}
