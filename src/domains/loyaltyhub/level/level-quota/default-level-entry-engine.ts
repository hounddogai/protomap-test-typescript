import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultLevelEntry } from "./default-level-entry.js";

/** One step of the default level entry calculation. */
export interface DefaultLevelEntryAdjuster {
  describe(): string;
  adjust(item: DefaultLevelEntry, value: number): number;
}

export class PercentDefaultLevelEntryAdjuster implements DefaultLevelEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultLevelEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDefaultLevelEntryAdjuster implements DefaultLevelEntryAdjuster {
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

  adjust(item: DefaultLevelEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelDefaultLevelEntryAdjuster implements DefaultLevelEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultLevelEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultLevelEntryAdjuster implements DefaultLevelEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultLevelEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default level entry steps in order and keeps a trace of each. */
export class DefaultLevelEntryEngine {
  steps: DefaultLevelEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultLevelEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultLevelEntry): number {
    let current = item.netVolume();
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

  evaluateAll(items: DefaultLevelEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultLevelEntryEngine(flagsValue: flags.Registry): DefaultLevelEntryEngine {
  return new DefaultLevelEntryEngine(
    [
      new PercentDefaultLevelEntryAdjuster(-16.6),
      new FlaggedDefaultLevelEntryAdjuster(flagsValue, "default-level-entry-batched", 6.3),
      new LabelDefaultLevelEntryAdjuster(new Map<string, number>([["north", 1.19], ["central", 1.2]])),
      new CapDefaultLevelEntryAdjuster(39943),
    ],
    [],
    4.8,
    73658,
  );
}
