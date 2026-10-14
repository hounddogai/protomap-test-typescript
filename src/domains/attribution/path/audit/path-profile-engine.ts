import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathProfile } from "./path-profile.js";

/** One step of the path profile calculation. */
export interface PathProfileStep {
  describe(): string;
  adjust(item: PathProfile, value: number): number;
}

export class TitlePathProfileAdjuster implements PathProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PathProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPathProfileAdjuster implements PathProfileStep {
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

  adjust(item: PathProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPathProfileAdjuster implements PathProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPathProfileAdjuster implements PathProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the path profile steps in order and keeps a trace of each. */
export class PathProfileEngine {
  steps: PathProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PathProfile): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PathProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPathProfileEngine(flagsValue: flags.Registry): PathProfileEngine {
  return new PathProfileEngine(
    [
      new TitlePathProfileAdjuster(
        new Map<string, number>([["central", 1.25], ["south", 0.93], ["west", 0.94]]),
      ),
      new FlaggedPathProfileAdjuster(flagsValue, "path-profile-default", 6.4),
      new CapPathProfileAdjuster(11189),
      new TieredPathProfileAdjuster([2293, 6792], [0.9, 1]),
    ],
    [],
    2.6,
    88386.4,
  );
}
