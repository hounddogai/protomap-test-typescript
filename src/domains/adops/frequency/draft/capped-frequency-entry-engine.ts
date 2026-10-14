import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedFrequencyEntry } from "./capped-frequency-entry.js";

/** One step of the capped frequency entry calculation. */
export interface CappedFrequencyEntryModifier {
  describe(): string;
  adjust(item: CappedFrequencyEntry, value: number): number;
}

export class CapCappedFrequencyEntryAdjuster implements CappedFrequencyEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedFrequencyEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCappedFrequencyEntryAdjuster implements CappedFrequencyEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedFrequencyEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedFrequencyEntryAdjuster implements CappedFrequencyEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedFrequencyEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCappedFrequencyEntryAdjuster implements CappedFrequencyEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedFrequencyEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedFrequencyEntryAdjuster implements CappedFrequencyEntryModifier {
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

  adjust(item: CappedFrequencyEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedFrequencyEntryAdjuster implements CappedFrequencyEntryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedFrequencyEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped frequency entry steps in order and keeps a trace of each. */
export class CappedFrequencyEntryEngine {
  steps: CappedFrequencyEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFrequencyEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedFrequencyEntry): number {
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

  evaluateAll(items: CappedFrequencyEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedFrequencyEntryEngine(flagsValue: flags.Registry): CappedFrequencyEntryEngine {
  return new CappedFrequencyEntryEngine(
    [
      new CapCappedFrequencyEntryAdjuster(30022),
      new MinimumCappedFrequencyEntryAdjuster(19.3),
      new RoundingCappedFrequencyEntryAdjuster(0.5),
      new TieredCappedFrequencyEntryAdjuster([570, 1017, 6533, 9533], [0.94, 1.07, 1.13, 0.82]),
      new FlaggedCappedFrequencyEntryAdjuster(flagsValue, "capped-frequency-entry-primary", -3.3),
      new PercentCappedFrequencyEntryAdjuster(-17.5),
    ],
    [],
    1.3,
    54644.8,
  );
}
