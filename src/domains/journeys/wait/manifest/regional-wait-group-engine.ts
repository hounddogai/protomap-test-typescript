import * as flags from "../../../../kit/flags.js";
import { RegionalWaitGroup } from "./regional-wait-group.js";

/** One step of the regional wait group calculation. */
export interface RegionalWaitGroupAdjuster {
  describe(): string;
  adjust(item: RegionalWaitGroup, value: number): number;
}

export class MinimumRegionalWaitGroupAdjuster implements RegionalWaitGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalWaitGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalWaitGroupAdjuster implements RegionalWaitGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalWaitGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionalWaitGroupAttemptsOffsetAdjuster implements RegionalWaitGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: RegionalWaitGroup, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class FlaggedRegionalWaitGroupAdjuster implements RegionalWaitGroupAdjuster {
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

  adjust(item: RegionalWaitGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameRegionalWaitGroupAdjuster implements RegionalWaitGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RegionalWaitGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional wait group steps in order and keeps a trace of each. */
export class RegionalWaitGroupEngine {
  steps: RegionalWaitGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalWaitGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalWaitGroup): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalWaitGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalWaitGroupEngine(flagsValue: flags.Registry): RegionalWaitGroupEngine {
  return new RegionalWaitGroupEngine(
    [
      new MinimumRegionalWaitGroupAdjuster(38.6),
      new TieredRegionalWaitGroupAdjuster([3035, 3451, 5332, 6979], [1.14, 0.96, 0.95, 1.11]),
      new RegionalWaitGroupAttemptsOffsetAdjuster(0.81),
      new FlaggedRegionalWaitGroupAdjuster(flagsValue, "regional-wait-group-pending", -9.1),
      new NameRegionalWaitGroupAdjuster(new Map<string, number>([["west", 0.91], ["online", 1.22]])),
    ],
    [],
    2.5,
    53486.1,
  );
}
