import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

/** One step of the adaptive double opt in exception calculation. */
export interface AdaptiveDoubleOptInExceptionAdjuster {
  describe(): string;
  adjust(item: AdaptiveDoubleOptInException, value: number): number;
}

export class RoundingAdaptiveDoubleOptInExceptionAdjuster implements AdaptiveDoubleOptInExceptionAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveDoubleOptInException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveDoubleOptInExceptionAdjuster implements AdaptiveDoubleOptInExceptionAdjuster {
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

  adjust(item: AdaptiveDoubleOptInException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveDoubleOptInExceptionConversionRateOffsetAdjuster implements AdaptiveDoubleOptInExceptionAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: AdaptiveDoubleOptInException, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class PercentAdaptiveDoubleOptInExceptionAdjuster implements AdaptiveDoubleOptInExceptionAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveDoubleOptInException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveDoubleOptInExceptionAdjuster implements AdaptiveDoubleOptInExceptionAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveDoubleOptInException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumAdaptiveDoubleOptInExceptionAdjuster implements AdaptiveDoubleOptInExceptionAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveDoubleOptInException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive double opt in exception steps in order and keeps a trace of each. */
export class AdaptiveDoubleOptInExceptionEngine {
  steps: AdaptiveDoubleOptInExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDoubleOptInExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveDoubleOptInException): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: AdaptiveDoubleOptInException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveDoubleOptInExceptionEngine(flagsValue: flags.Registry): AdaptiveDoubleOptInExceptionEngine {
  return new AdaptiveDoubleOptInExceptionEngine(
    [
      new RoundingAdaptiveDoubleOptInExceptionAdjuster(0.25),
      new FlaggedAdaptiveDoubleOptInExceptionAdjuster(
        flagsValue,
        "adaptive-double-opt-in-exception-lenient",
        -8.6,
      ),
      new AdaptiveDoubleOptInExceptionConversionRateOffsetAdjuster(0.07),
      new PercentAdaptiveDoubleOptInExceptionAdjuster(2.9),
      new TieredAdaptiveDoubleOptInExceptionAdjuster([3933, 6212, 9143], [1.09, 0.93, 1.1]),
      new MinimumAdaptiveDoubleOptInExceptionAdjuster(21.3),
    ],
    [],
    1.6,
    41920.9,
  );
}
