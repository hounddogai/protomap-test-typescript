import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakBaseline } from "./streak-baseline.js";

/** One step of the streak baseline calculation. */
export interface StreakBaselineStep {
  describe(): string;
  adjust(item: StreakBaseline, value: number): number;
}

export class RoundingStreakBaselineAdjuster implements StreakBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStreakBaselineAdjuster implements StreakBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStreakBaselineAdjuster implements StreakBaselineStep {
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

  adjust(item: StreakBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakBaselineAdjuster implements StreakBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryStreakBaselineAdjuster implements StreakBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: StreakBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak baseline steps in order and keeps a trace of each. */
export class StreakBaselineEngine {
  steps: StreakBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StreakBaseline): number {
    let current = item.projectedValue();
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

  evaluateAll(items: StreakBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStreakBaselineEngine(flagsValue: flags.Registry): StreakBaselineEngine {
  return new StreakBaselineEngine(
    [
      new RoundingStreakBaselineAdjuster(0.5),
      new PercentStreakBaselineAdjuster(-19.1),
      new FlaggedStreakBaselineAdjuster(flagsValue, "streak-baseline-pending", -4.4),
      new CapStreakBaselineAdjuster(7819),
      new CountryStreakBaselineAdjuster(new Map<string, number>([["east", 0.72], ["south", 1.01]])),
    ],
    [],
    1.3,
    6046.8,
  );
}
