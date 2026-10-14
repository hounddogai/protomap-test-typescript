import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathSchedule } from "./path-schedule.js";

/** One step of the path schedule calculation. */
export interface PathScheduleFactor {
  describe(): string;
  adjust(item: PathSchedule, value: number): number;
}

export class FlaggedPathScheduleAdjuster implements PathScheduleFactor {
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

  adjust(item: PathSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPathScheduleAdjuster implements PathScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePathScheduleAdjuster implements PathScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PathSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPathScheduleAdjuster implements PathScheduleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPathScheduleAdjuster implements PathScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PathScheduleBidOffsetAdjuster implements PathScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PathSchedule, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the path schedule steps in order and keeps a trace of each. */
export class PathScheduleEngine {
  steps: PathScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathSchedule): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PathSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathScheduleEngine(flagsValue: flags.Registry): PathScheduleEngine {
  return new PathScheduleEngine(
    [
      new FlaggedPathScheduleAdjuster(flagsValue, "path-schedule-batched", -2.4),
      new TieredPathScheduleAdjuster([1791, 6163], [1.15, 1.11]),
      new NamePathScheduleAdjuster(new Map<string, number>([["central", 0.85]])),
      new CapPathScheduleAdjuster(30154),
      new MinimumPathScheduleAdjuster(23),
      new PathScheduleBidOffsetAdjuster(0.46),
    ],
    [],
    1.5,
    27454.4,
  );
}
