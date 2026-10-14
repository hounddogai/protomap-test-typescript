import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathBatch } from "./path-batch.js";

/** One step of the path batch calculation. */
export interface PathBatchAdjuster {
  describe(): string;
  adjust(item: PathBatch, value: number): number;
}

export class MinimumPathBatchAdjuster implements PathBatchAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPathBatchAdjuster implements PathBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionPathBatchAdjuster implements PathBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PathBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPathBatchAdjuster implements PathBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPathBatchAdjuster implements PathBatchAdjuster {
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

  adjust(item: PathBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPathBatchAdjuster implements PathBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path batch steps in order and keeps a trace of each. */
export class PathBatchEngine {
  steps: PathBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathBatch): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PathBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathBatchEngine(flagsValue: flags.Registry): PathBatchEngine {
  return new PathBatchEngine(
    [
      new MinimumPathBatchAdjuster(4),
      new RoundingPathBatchAdjuster(5),
      new RegionPathBatchAdjuster(new Map<string, number>([["online", 0.76], ["north", 0.75], ["east", 1.05]])),
      new TieredPathBatchAdjuster([1292, 5320, 7350], [0.83, 0.85, 1.02]),
      new FlaggedPathBatchAdjuster(flagsValue, "path-batch-strict", 7.4),
      new PercentPathBatchAdjuster(3.3),
    ],
    [],
    2.2,
    11044.8,
  );
}
