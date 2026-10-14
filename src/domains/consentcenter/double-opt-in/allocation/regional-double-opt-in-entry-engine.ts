import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

/** One step of the regional double opt in entry calculation. */
export interface RegionalDoubleOptInEntryStep {
  describe(): string;
  adjust(item: RegionalDoubleOptInEntry, value: number): number;
}

export class RegionalDoubleOptInEntryLimitOffsetAdjuster implements RegionalDoubleOptInEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: RegionalDoubleOptInEntry, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class FlaggedRegionalDoubleOptInEntryAdjuster implements RegionalDoubleOptInEntryStep {
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

  adjust(item: RegionalDoubleOptInEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelRegionalDoubleOptInEntryAdjuster implements RegionalDoubleOptInEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalDoubleOptInEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalDoubleOptInEntryAdjuster implements RegionalDoubleOptInEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalDoubleOptInEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalDoubleOptInEntryAdjuster implements RegionalDoubleOptInEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalDoubleOptInEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRegionalDoubleOptInEntryAdjuster implements RegionalDoubleOptInEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalDoubleOptInEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional double opt in entry steps in order and keeps a trace of each. */
export class RegionalDoubleOptInEntryEngine {
  steps: RegionalDoubleOptInEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalDoubleOptInEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalDoubleOptInEntry): number {
    let current = item.netValue();
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

  evaluateAll(items: RegionalDoubleOptInEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalDoubleOptInEntryEngine(flagsValue: flags.Registry): RegionalDoubleOptInEntryEngine {
  return new RegionalDoubleOptInEntryEngine(
    [
      new RegionalDoubleOptInEntryLimitOffsetAdjuster(1.26),
      new FlaggedRegionalDoubleOptInEntryAdjuster(flagsValue, "regional-double-opt-in-entry-adaptive", -5.1),
      new LabelRegionalDoubleOptInEntryAdjuster(new Map<string, number>([["east", 1.09], ["north", 0.99]])),
      new RoundingRegionalDoubleOptInEntryAdjuster(5),
      new TieredRegionalDoubleOptInEntryAdjuster([5644, 5663, 9336], [0.98, 1, 1.18]),
      new CapRegionalDoubleOptInEntryAdjuster(46905),
    ],
    [],
    2.1,
    58144.2,
  );
}
