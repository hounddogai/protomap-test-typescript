import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictCreditEntry } from "./strict-credit-entry.js";

/** One step of the strict credit entry calculation. */
export interface StrictCreditEntryModifier {
  describe(): string;
  adjust(item: StrictCreditEntry, value: number): number;
}

export class CapStrictCreditEntryAdjuster implements StrictCreditEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCreditEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStrictCreditEntryAdjuster implements StrictCreditEntryModifier {
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

  adjust(item: StrictCreditEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictCreditEntryAdjuster implements StrictCreditEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictCreditEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict credit entry steps in order and keeps a trace of each. */
export class StrictCreditEntryEngine {
  steps: StrictCreditEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCreditEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictCreditEntry): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: StrictCreditEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictCreditEntryEngine(flagsValue: flags.Registry): StrictCreditEntryEngine {
  return new StrictCreditEntryEngine(
    [
      new CapStrictCreditEntryAdjuster(1829),
      new FlaggedStrictCreditEntryAdjuster(flagsValue, "strict-credit-entry-rolling", -3.8),
      new MinimumStrictCreditEntryAdjuster(46.9),
    ],
    [],
    3.9,
    24527.7,
  );
}
