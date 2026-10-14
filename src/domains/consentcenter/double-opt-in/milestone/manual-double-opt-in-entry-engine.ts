import * as flags from "../../../../kit/flags.js";
import { ManualDoubleOptInEntry } from "./manual-double-opt-in-entry.js";

/** One step of the manual double opt in entry calculation. */
export interface ManualDoubleOptInEntryAdjuster {
  describe(): string;
  adjust(item: ManualDoubleOptInEntry, value: number): number;
}

export class FlaggedManualDoubleOptInEntryAdjuster implements ManualDoubleOptInEntryAdjuster {
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

  adjust(item: ManualDoubleOptInEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleManualDoubleOptInEntryAdjuster implements ManualDoubleOptInEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualDoubleOptInEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapManualDoubleOptInEntryAdjuster implements ManualDoubleOptInEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualDoubleOptInEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualDoubleOptInEntryAdjuster implements ManualDoubleOptInEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualDoubleOptInEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual double opt in entry steps in order and keeps a trace of each. */
export class ManualDoubleOptInEntryEngine {
  steps: ManualDoubleOptInEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualDoubleOptInEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualDoubleOptInEntry): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ManualDoubleOptInEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualDoubleOptInEntryEngine(flagsValue: flags.Registry): ManualDoubleOptInEntryEngine {
  return new ManualDoubleOptInEntryEngine(
    [
      new FlaggedManualDoubleOptInEntryAdjuster(flagsValue, "manual-double-opt-in-entry-global", -4.5),
      new TitleManualDoubleOptInEntryAdjuster(new Map<string, number>([["north", 1.14]])),
      new CapManualDoubleOptInEntryAdjuster(34313),
      new TieredManualDoubleOptInEntryAdjuster([5856, 6962, 8051], [1.18, 1.04, 0.88]),
    ],
    [],
    3,
    64750.5,
  );
}
