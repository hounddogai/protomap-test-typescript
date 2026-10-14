import * as flags from "../../../../kit/flags.js";
import { AdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

/** One step of the adaptive csat threshold calculation. */
export interface AdaptiveCsatThresholdModifier {
  describe(): string;
  adjust(item: AdaptiveCsatThreshold, value: number): number;
}

export class TieredAdaptiveCsatThresholdAdjuster implements AdaptiveCsatThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveCsatThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveCsatThresholdAdjuster implements AdaptiveCsatThresholdModifier {
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

  adjust(item: AdaptiveCsatThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveCsatThresholdAdjuster implements AdaptiveCsatThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveCsatThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveCsatThresholdAdjuster implements AdaptiveCsatThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveCsatThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive csat threshold steps in order and keeps a trace of each. */
export class AdaptiveCsatThresholdEngine {
  steps: AdaptiveCsatThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCsatThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveCsatThreshold): number {
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

  evaluateAll(items: AdaptiveCsatThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveCsatThresholdEngine(flagsValue: flags.Registry): AdaptiveCsatThresholdEngine {
  return new AdaptiveCsatThresholdEngine(
    [
      new TieredAdaptiveCsatThresholdAdjuster([1315, 2879, 3177, 5327], [0.86, 1.07, 1.11, 1.07]),
      new FlaggedAdaptiveCsatThresholdAdjuster(flagsValue, "adaptive-csat-threshold-capped", 9.3),
      new MinimumAdaptiveCsatThresholdAdjuster(30.4),
      new PercentAdaptiveCsatThresholdAdjuster(-19.5),
    ],
    [],
    0.5,
    30469.6,
  );
}
