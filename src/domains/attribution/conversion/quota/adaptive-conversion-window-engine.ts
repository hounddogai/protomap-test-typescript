import * as flags from "../../../../kit/flags.js";
import { AdaptiveConversionWindow } from "./adaptive-conversion-window.js";

/** One step of the adaptive conversion window calculation. */
export interface AdaptiveConversionWindowStep {
  describe(): string;
  adjust(item: AdaptiveConversionWindow, value: number): number;
}

export class AdaptiveConversionWindowAmountOffsetAdjuster implements AdaptiveConversionWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: AdaptiveConversionWindow, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class TieredAdaptiveConversionWindowAdjuster implements AdaptiveConversionWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveConversionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumAdaptiveConversionWindowAdjuster implements AdaptiveConversionWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveConversionWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveConversionWindowAdjuster implements AdaptiveConversionWindowStep {
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

  adjust(item: AdaptiveConversionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive conversion window steps in order and keeps a trace of each. */
export class AdaptiveConversionWindowEngine {
  steps: AdaptiveConversionWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveConversionWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveConversionWindow): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: AdaptiveConversionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveConversionWindowEngine(flagsValue: flags.Registry): AdaptiveConversionWindowEngine {
  return new AdaptiveConversionWindowEngine(
    [
      new AdaptiveConversionWindowAmountOffsetAdjuster(1.71),
      new TieredAdaptiveConversionWindowAdjuster([134, 7910, 8789, 9423], [0.84, 1.15, 0.99, 0.94]),
      new MinimumAdaptiveConversionWindowAdjuster(0.4),
      new FlaggedAdaptiveConversionWindowAdjuster(flagsValue, "adaptive-conversion-window-lenient", -4.1),
    ],
    [],
    0.2,
    75036.9,
  );
}
