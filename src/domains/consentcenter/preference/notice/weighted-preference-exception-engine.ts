import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedPreferenceException } from "./weighted-preference-exception.js";

/** One step of the weighted preference exception calculation. */
export interface WeightedPreferenceExceptionFactor {
  describe(): string;
  adjust(item: WeightedPreferenceException, value: number): number;
}

export class FlaggedWeightedPreferenceExceptionAdjuster implements WeightedPreferenceExceptionFactor {
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

  adjust(item: WeightedPreferenceException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedPreferenceExceptionAdjuster implements WeightedPreferenceExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPreferenceException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedPreferenceExceptionLimitOffsetAdjuster implements WeightedPreferenceExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: WeightedPreferenceException, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class CapWeightedPreferenceExceptionAdjuster implements WeightedPreferenceExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedPreferenceException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedPreferenceExceptionAdjuster implements WeightedPreferenceExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedPreferenceException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted preference exception steps in order and keeps a trace of each. */
export class WeightedPreferenceExceptionEngine {
  steps: WeightedPreferenceExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPreferenceExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedPreferenceException): number {
    let current = item.netValue();
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

  evaluateAll(items: WeightedPreferenceException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedPreferenceExceptionEngine(flagsValue: flags.Registry): WeightedPreferenceExceptionEngine {
  return new WeightedPreferenceExceptionEngine(
    [
      new FlaggedWeightedPreferenceExceptionAdjuster(flagsValue, "weighted-preference-exception-default", 1.5),
      new MinimumWeightedPreferenceExceptionAdjuster(12),
      new WeightedPreferenceExceptionLimitOffsetAdjuster(1.83),
      new CapWeightedPreferenceExceptionAdjuster(10599),
      new RoundingWeightedPreferenceExceptionAdjuster(0.1),
    ],
    [],
    2.7,
    38025.5,
  );
}
