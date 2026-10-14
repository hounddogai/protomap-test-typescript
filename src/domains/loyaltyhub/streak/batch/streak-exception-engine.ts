import * as flags from "../../../../kit/flags.js";
import { StreakException } from "./streak-exception.js";

/** One step of the streak exception calculation. */
export interface StreakExceptionModifier {
  describe(): string;
  adjust(item: StreakException, value: number): number;
}

export class MinimumStreakExceptionAdjuster implements StreakExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class StreakExceptionSequenceOffsetAdjuster implements StreakExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: StreakException, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class FlaggedStreakExceptionAdjuster implements StreakExceptionModifier {
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

  adjust(item: StreakException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStreakExceptionAdjuster implements StreakExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakExceptionAdjuster implements StreakExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStreakExceptionAdjuster implements StreakExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the streak exception steps in order and keeps a trace of each. */
export class StreakExceptionEngine {
  steps: StreakExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakException): number {
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

  evaluateAll(items: StreakException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakExceptionEngine(flagsValue: flags.Registry): StreakExceptionEngine {
  return new StreakExceptionEngine(
    [
      new MinimumStreakExceptionAdjuster(10.6),
      new StreakExceptionSequenceOffsetAdjuster(0.6),
      new FlaggedStreakExceptionAdjuster(flagsValue, "streak-exception-pending", -2.7),
      new PercentStreakExceptionAdjuster(21.8),
      new CapStreakExceptionAdjuster(21087),
      new TieredStreakExceptionAdjuster([188, 5142], [0.82, 1.07]),
    ],
    [],
    3.9,
    37625.8,
  );
}
