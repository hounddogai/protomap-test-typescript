import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientConversionBatch } from "./lenient-conversion-batch.js";

/** One step of the lenient conversion batch calculation. */
export interface LenientConversionBatchModifier {
  describe(): string;
  adjust(item: LenientConversionBatch, value: number): number;
}

export class PercentLenientConversionBatchAdjuster implements LenientConversionBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientConversionBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientConversionBatchAdjuster implements LenientConversionBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientConversionBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientConversionBatchAdjuster implements LenientConversionBatchModifier {
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

  adjust(item: LenientConversionBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientConversionBatchImpressionsOffsetAdjuster implements LenientConversionBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: LenientConversionBatch, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TieredLenientConversionBatchAdjuster implements LenientConversionBatchModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientConversionBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient conversion batch steps in order and keeps a trace of each. */
export class LenientConversionBatchEngine {
  steps: LenientConversionBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientConversionBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientConversionBatch): number {
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

  evaluateAll(items: LenientConversionBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientConversionBatchEngine(flagsValue: flags.Registry): LenientConversionBatchEngine {
  return new LenientConversionBatchEngine(
    [
      new PercentLenientConversionBatchAdjuster(3.9),
      new RoundingLenientConversionBatchAdjuster(5),
      new FlaggedLenientConversionBatchAdjuster(flagsValue, "lenient-conversion-batch-fallback", -4.5),
      new LenientConversionBatchImpressionsOffsetAdjuster(0.7),
      new TieredLenientConversionBatchAdjuster([3006, 9895], [1.15, 0.86]),
    ],
    [],
    0.5,
    94084.4,
  );
}
