import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedFrequencyBaseline } from "./capped-frequency-baseline.js";

/** One step of the capped frequency baseline calculation. */
export interface CappedFrequencyBaselineModifier {
  describe(): string;
  adjust(item: CappedFrequencyBaseline, value: number): number;
}

export class TieredCappedFrequencyBaselineAdjuster implements CappedFrequencyBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedFrequencyBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCappedFrequencyBaselineAdjuster implements CappedFrequencyBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedFrequencyBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCappedFrequencyBaselineAdjuster implements CappedFrequencyBaselineModifier {
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

  adjust(item: CappedFrequencyBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedFrequencyBaselineAdjuster implements CappedFrequencyBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedFrequencyBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedFrequencyBaselineQuantityOffsetAdjuster implements CappedFrequencyBaselineModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: CappedFrequencyBaseline, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingCappedFrequencyBaselineAdjuster implements CappedFrequencyBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedFrequencyBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped frequency baseline steps in order and keeps a trace of each. */
export class CappedFrequencyBaselineEngine {
  steps: CappedFrequencyBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFrequencyBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedFrequencyBaseline): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CappedFrequencyBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedFrequencyBaselineEngine(flagsValue: flags.Registry): CappedFrequencyBaselineEngine {
  return new CappedFrequencyBaselineEngine(
    [
      new TieredCappedFrequencyBaselineAdjuster([4453, 4454, 4924, 6018], [1, 1.02, 1.1, 0.97]),
      new CapCappedFrequencyBaselineAdjuster(15310),
      new FlaggedCappedFrequencyBaselineAdjuster(flagsValue, "capped-frequency-baseline-seasonal", 6.1),
      new PercentCappedFrequencyBaselineAdjuster(-12.8),
      new CappedFrequencyBaselineQuantityOffsetAdjuster(1.33),
      new RoundingCappedFrequencyBaselineAdjuster(0.25),
    ],
    [],
    3,
    9704.7,
  );
}
