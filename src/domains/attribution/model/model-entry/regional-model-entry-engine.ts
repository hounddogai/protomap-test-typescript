import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalModelEntry } from "./regional-model-entry.js";

/** One step of the regional model entry calculation. */
export interface RegionalModelEntryAdjuster {
  describe(): string;
  adjust(item: RegionalModelEntry, value: number): number;
}

export class FlaggedRegionalModelEntryAdjuster implements RegionalModelEntryAdjuster {
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

  adjust(item: RegionalModelEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalModelEntryAdjuster implements RegionalModelEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalModelEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalModelEntryAdjuster implements RegionalModelEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalModelEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRegionalModelEntryAdjuster implements RegionalModelEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalModelEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRegionalModelEntryAdjuster implements RegionalModelEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalModelEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional model entry steps in order and keeps a trace of each. */
export class RegionalModelEntryEngine {
  steps: RegionalModelEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalModelEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalModelEntry): number {
    let current = item.netLoad();
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

  evaluateAll(items: RegionalModelEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalModelEntryEngine(flagsValue: flags.Registry): RegionalModelEntryEngine {
  return new RegionalModelEntryEngine(
    [
      new FlaggedRegionalModelEntryAdjuster(flagsValue, "regional-model-entry-manual", -1.5),
      new CapRegionalModelEntryAdjuster(29242),
      new MinimumRegionalModelEntryAdjuster(0.7),
      new RoundingRegionalModelEntryAdjuster(1),
      new TieredRegionalModelEntryAdjuster([629, 8712, 8957, 9289], [0.82, 1.07, 0.96, 1]),
    ],
    [],
    0.2,
    46357,
  );
}
