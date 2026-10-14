import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalCreativeEntry } from "./regional-creative-entry.js";

/** One step of the regional creative entry calculation. */
export interface RegionalCreativeEntryModifier {
  describe(): string;
  adjust(item: RegionalCreativeEntry, value: number): number;
}

export class RoundingRegionalCreativeEntryAdjuster implements RegionalCreativeEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalCreativeEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalCreativeEntryAdjuster implements RegionalCreativeEntryModifier {
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

  adjust(item: RegionalCreativeEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalCreativeEntryAdjuster implements RegionalCreativeEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalCreativeEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionRegionalCreativeEntryAdjuster implements RegionalCreativeEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RegionalCreativeEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalCreativeEntryAdjuster implements RegionalCreativeEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalCreativeEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional creative entry steps in order and keeps a trace of each. */
export class RegionalCreativeEntryEngine {
  steps: RegionalCreativeEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCreativeEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalCreativeEntry): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RegionalCreativeEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalCreativeEntryEngine(flagsValue: flags.Registry): RegionalCreativeEntryEngine {
  return new RegionalCreativeEntryEngine(
    [
      new RoundingRegionalCreativeEntryAdjuster(0.05),
      new FlaggedRegionalCreativeEntryAdjuster(flagsValue, "regional-creative-entry-batched", 8.6),
      new MinimumRegionalCreativeEntryAdjuster(21.7),
      new RegionRegionalCreativeEntryAdjuster(new Map<string, number>([["west", 1.15], ["retail", 1.07]])),
      new CapRegionalCreativeEntryAdjuster(3235),
    ],
    [],
    0.5,
    84866.9,
  );
}
