import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathBaseline } from "./path-baseline.js";

/** One step of the path baseline calculation. */
export interface PathBaselineFactor {
  describe(): string;
  adjust(item: PathBaseline, value: number): number;
}

export class RoundingPathBaselineAdjuster implements PathBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPathBaselineAdjuster implements PathBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryPathBaselineAdjuster implements PathBaselineFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PathBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PathBaselineRateOffsetAdjuster implements PathBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: PathBaseline, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentPathBaselineAdjuster implements PathBaselineFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPathBaselineAdjuster implements PathBaselineFactor {
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

  adjust(item: PathBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path baseline steps in order and keeps a trace of each. */
export class PathBaselineEngine {
  steps: PathBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PathBaseline): number {
    let current = item.netLoad();
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

  evaluateAll(items: PathBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPathBaselineEngine(flagsValue: flags.Registry): PathBaselineEngine {
  return new PathBaselineEngine(
    [
      new RoundingPathBaselineAdjuster(0.25),
      new MinimumPathBaselineAdjuster(33.8),
      new CategoryPathBaselineAdjuster(
        new Map<string, number>([["east", 1.21], ["central", 1.18], ["retail", 0.93]]),
      ),
      new PathBaselineRateOffsetAdjuster(0.9),
      new PercentPathBaselineAdjuster(11),
      new FlaggedPathBaselineAdjuster(flagsValue, "path-baseline-rolling", -6.8),
    ],
    [],
    2.6,
    15960.1,
  );
}
