import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathMetric } from "./path-metric.js";

/** One step of the path metric calculation. */
export interface PathMetricFactor {
  describe(): string;
  adjust(item: PathMetric, value: number): number;
}

export class RoundingPathMetricAdjuster implements PathMetricFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPathMetricAdjuster implements PathMetricFactor {
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

  adjust(item: PathMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPathMetricAdjuster implements PathMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPathMetricAdjuster implements PathMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NamePathMetricAdjuster implements PathMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PathMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the path metric steps in order and keeps a trace of each. */
export class PathMetricEngine {
  steps: PathMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PathMetric): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PathMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPathMetricEngine(flagsValue: flags.Registry): PathMetricEngine {
  return new PathMetricEngine(
    [
      new RoundingPathMetricAdjuster(0.25),
      new FlaggedPathMetricAdjuster(flagsValue, "path-metric-strict", 2.6),
      new MinimumPathMetricAdjuster(4.6),
      new CapPathMetricAdjuster(46317),
      new NamePathMetricAdjuster(new Map<string, number>([["online", 1], ["south", 0.98]])),
    ],
    [],
    1.9,
    89940.5,
  );
}
