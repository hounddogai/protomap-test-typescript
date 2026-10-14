import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalPlacementEntry } from "./global-placement-entry.js";

/** One step of the global placement entry calculation. */
export interface GlobalPlacementEntryFactor {
  describe(): string;
  adjust(item: GlobalPlacementEntry, value: number): number;
}

export class TieredGlobalPlacementEntryAdjuster implements GlobalPlacementEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPlacementEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalPlacementEntryAdjuster implements GlobalPlacementEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPlacementEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalPlacementEntryAdjuster implements GlobalPlacementEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPlacementEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalPlacementEntryAdjuster implements GlobalPlacementEntryFactor {
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

  adjust(item: GlobalPlacementEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global placement entry steps in order and keeps a trace of each. */
export class GlobalPlacementEntryEngine {
  steps: GlobalPlacementEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPlacementEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalPlacementEntry): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: GlobalPlacementEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalPlacementEntryEngine(flagsValue: flags.Registry): GlobalPlacementEntryEngine {
  return new GlobalPlacementEntryEngine(
    [
      new TieredGlobalPlacementEntryAdjuster([1636, 6329], [1.09, 1.16]),
      new RoundingGlobalPlacementEntryAdjuster(0.5),
      new CapGlobalPlacementEntryAdjuster(2499),
      new FlaggedGlobalPlacementEntryAdjuster(flagsValue, "global-placement-entry-adaptive", -1.7),
    ],
    [],
    1.1,
    66833.1,
  );
}
