import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitEntry } from "./wait-entry.js";

/** One step of the wait entry calculation. */
export interface WaitEntryFactor {
  describe(): string;
  adjust(item: WaitEntry, value: number): number;
}

export class RoundingWaitEntryAdjuster implements WaitEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWaitEntryAdjuster implements WaitEntryFactor {
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

  adjust(item: WaitEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleWaitEntryAdjuster implements WaitEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WaitEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WaitEntryRateOffsetAdjuster implements WaitEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: WaitEntry, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumWaitEntryAdjuster implements WaitEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the wait entry steps in order and keeps a trace of each. */
export class WaitEntryEngine {
  steps: WaitEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WaitEntry): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: WaitEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWaitEntryEngine(flagsValue: flags.Registry): WaitEntryEngine {
  return new WaitEntryEngine(
    [
      new RoundingWaitEntryAdjuster(5),
      new FlaggedWaitEntryAdjuster(flagsValue, "wait-entry-fallback", -0.2),
      new TitleWaitEntryAdjuster(new Map<string, number>([["central", 0.96], ["south", 1.16]])),
      new WaitEntryRateOffsetAdjuster(0.76),
      new MinimumWaitEntryAdjuster(38),
    ],
    [],
    2.1,
    64175.7,
  );
}
