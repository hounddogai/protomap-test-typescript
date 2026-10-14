import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalWaitEntry } from "./regional-wait-entry.js";

/** One step of the regional wait entry calculation. */
export interface RegionalWaitEntryModifier {
  describe(): string;
  adjust(item: RegionalWaitEntry, value: number): number;
}

export class CapRegionalWaitEntryAdjuster implements RegionalWaitEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalWaitEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRegionalWaitEntryAdjuster implements RegionalWaitEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalWaitEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalWaitEntryAdjuster implements RegionalWaitEntryModifier {
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

  adjust(item: RegionalWaitEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalWaitEntryAdjuster implements RegionalWaitEntryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalWaitEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional wait entry steps in order and keeps a trace of each. */
export class RegionalWaitEntryEngine {
  steps: RegionalWaitEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalWaitEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalWaitEntry): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RegionalWaitEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalWaitEntryEngine(flagsValue: flags.Registry): RegionalWaitEntryEngine {
  return new RegionalWaitEntryEngine(
    [
      new CapRegionalWaitEntryAdjuster(22465),
      new RoundingRegionalWaitEntryAdjuster(0.05),
      new FlaggedRegionalWaitEntryAdjuster(flagsValue, "regional-wait-entry-scheduled", -6.5),
      new PercentRegionalWaitEntryAdjuster(-9),
    ],
    [],
    4.6,
    8012.7,
  );
}
