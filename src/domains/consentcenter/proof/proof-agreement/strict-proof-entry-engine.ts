import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictProofEntry } from "./strict-proof-entry.js";

/** One step of the strict proof entry calculation. */
export interface StrictProofEntryAdjuster {
  describe(): string;
  adjust(item: StrictProofEntry, value: number): number;
}

export class CapStrictProofEntryAdjuster implements StrictProofEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictProofEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStrictProofEntryAdjuster implements StrictProofEntryAdjuster {
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

  adjust(item: StrictProofEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictProofEntryAdjuster implements StrictProofEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictProofEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictProofEntryAmountOffsetAdjuster implements StrictProofEntryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: StrictProofEntry, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class NameStrictProofEntryAdjuster implements StrictProofEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictProofEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictProofEntryAdjuster implements StrictProofEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictProofEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict proof entry steps in order and keeps a trace of each. */
export class StrictProofEntryEngine {
  steps: StrictProofEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictProofEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictProofEntry): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictProofEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictProofEntryEngine(flagsValue: flags.Registry): StrictProofEntryEngine {
  return new StrictProofEntryEngine(
    [
      new CapStrictProofEntryAdjuster(26121),
      new FlaggedStrictProofEntryAdjuster(flagsValue, "strict-proof-entry-seasonal", 6.7),
      new RoundingStrictProofEntryAdjuster(1),
      new StrictProofEntryAmountOffsetAdjuster(1.94),
      new NameStrictProofEntryAdjuster(new Map<string, number>([["south", 0.76]])),
      new TieredStrictProofEntryAdjuster([2103, 4410, 8422], [1.02, 0.9, 0.99]),
    ],
    [],
    3.9,
    85624.7,
  );
}
