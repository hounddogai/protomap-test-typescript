import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathBundle } from "./path-bundle.js";

/** One step of the path bundle calculation. */
export interface PathBundleFactor {
  describe(): string;
  adjust(item: PathBundle, value: number): number;
}

export class FlaggedPathBundleAdjuster implements PathBundleFactor {
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

  adjust(item: PathBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelPathBundleAdjuster implements PathBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PathBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPathBundleAdjuster implements PathBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPathBundleAdjuster implements PathBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPathBundleAdjuster implements PathBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PathBundleRetriesOffsetAdjuster implements PathBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PathBundle, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the path bundle steps in order and keeps a trace of each. */
export class PathBundleEngine {
  steps: PathBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathBundle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: PathBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathBundleEngine(flagsValue: flags.Registry): PathBundleEngine {
  return new PathBundleEngine(
    [
      new FlaggedPathBundleAdjuster(flagsValue, "path-bundle-pending", -8.3),
      new ChannelPathBundleAdjuster(
        new Map<string, number>([["central", 1.35], ["west", 1.36], ["online", 1.16]]),
      ),
      new PercentPathBundleAdjuster(-4),
      new TieredPathBundleAdjuster([1174, 2386, 8552, 8624], [0.96, 0.97, 0.9, 1]),
      new RoundingPathBundleAdjuster(0.25),
      new PathBundleRetriesOffsetAdjuster(0.89),
    ],
    [],
    4.2,
    97430.1,
  );
}
