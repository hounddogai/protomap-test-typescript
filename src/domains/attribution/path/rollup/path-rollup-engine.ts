import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathRollup } from "./path-rollup.js";

/** One step of the path rollup calculation. */
export interface PathRollupModifier {
  describe(): string;
  adjust(item: PathRollup, value: number): number;
}

export class PathRollupFrequencyCapOffsetAdjuster implements PathRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: PathRollup, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class MinimumPathRollupAdjuster implements PathRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPathRollupAdjuster implements PathRollupModifier {
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

  adjust(item: PathRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPathRollupAdjuster implements PathRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPathRollupAdjuster implements PathRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPathRollupAdjuster implements PathRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the path rollup steps in order and keeps a trace of each. */
export class PathRollupEngine {
  steps: PathRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PathRollup): number {
    let current = item.netTotal();
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

  evaluateAll(items: PathRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPathRollupEngine(flagsValue: flags.Registry): PathRollupEngine {
  return new PathRollupEngine(
    [
      new PathRollupFrequencyCapOffsetAdjuster(1.73),
      new MinimumPathRollupAdjuster(16.4),
      new FlaggedPathRollupAdjuster(flagsValue, "path-rollup-regional", -7.1),
      new PercentPathRollupAdjuster(-17),
      new TieredPathRollupAdjuster([4537, 5667], [1.17, 1.13]),
      new RoundingPathRollupAdjuster(5),
    ],
    [],
    0.2,
    89429.7,
  );
}
