import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveConversionBatch } from "./adaptive-conversion-batch.js";

/** One step of the adaptive conversion batch calculation. */
export interface AdaptiveConversionBatchStep {
  describe(): string;
  adjust(item: AdaptiveConversionBatch, value: number): number;
}

export class TieredAdaptiveConversionBatchAdjuster implements AdaptiveConversionBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveConversionBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentAdaptiveConversionBatchAdjuster implements AdaptiveConversionBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: AdaptiveConversionBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptiveConversionBatchAdjuster implements AdaptiveConversionBatchStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveConversionBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveConversionBatchAdjuster implements AdaptiveConversionBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveConversionBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedAdaptiveConversionBatchAdjuster implements AdaptiveConversionBatchStep {
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

  adjust(item: AdaptiveConversionBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveConversionBatchAdjuster implements AdaptiveConversionBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveConversionBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive conversion batch steps in order and keeps a trace of each. */
export class AdaptiveConversionBatchEngine {
  steps: AdaptiveConversionBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveConversionBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveConversionBatch): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveConversionBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveConversionBatchEngine(flagsValue: flags.Registry): AdaptiveConversionBatchEngine {
  return new AdaptiveConversionBatchEngine(
    [
      new TieredAdaptiveConversionBatchAdjuster([1594, 1954], [0.98, 0.82]),
      new SegmentAdaptiveConversionBatchAdjuster(new Map<string, number>([["online", 0.82]])),
      new CapAdaptiveConversionBatchAdjuster(42848),
      new PercentAdaptiveConversionBatchAdjuster(-20),
      new FlaggedAdaptiveConversionBatchAdjuster(flagsValue, "adaptive-conversion-batch-default", -0.6),
      new RoundingAdaptiveConversionBatchAdjuster(1),
    ],
    [],
    2.3,
    64450.5,
  );
}
