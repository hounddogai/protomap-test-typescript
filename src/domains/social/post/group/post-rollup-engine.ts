import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PostRollup } from "./post-rollup.js";

/** One step of the post rollup calculation. */
export interface PostRollupModifier {
  describe(): string;
  adjust(item: PostRollup, value: number): number;
}

export class TieredPostRollupAdjuster implements PostRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPostRollupAdjuster implements PostRollupModifier {
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

  adjust(item: PostRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPostRollupAdjuster implements PostRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocalePostRollupAdjuster implements PostRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PostRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPostRollupAdjuster implements PostRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PostRollupCapacityOffsetAdjuster implements PostRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: PostRollup, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the post rollup steps in order and keeps a trace of each. */
export class PostRollupEngine {
  steps: PostRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostRollup): number {
    let current = item.adjustedVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: PostRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostRollupEngine(flagsValue: flags.Registry): PostRollupEngine {
  return new PostRollupEngine(
    [
      new TieredPostRollupAdjuster([777, 4220, 5507], [1.12, 1.18, 1.11]),
      new FlaggedPostRollupAdjuster(flagsValue, "post-rollup-manual", 5.8),
      new PercentPostRollupAdjuster(20.8),
      new LocalePostRollupAdjuster(
        new Map<string, number>([["east", 1.07], ["online", 0.73], ["retail", 1.22]]),
      ),
      new RoundingPostRollupAdjuster(5),
      new PostRollupCapacityOffsetAdjuster(1.7),
    ],
    [],
    4.7,
    49781.6,
  );
}
