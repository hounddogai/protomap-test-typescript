import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualLevelEntry } from "./manual-level-entry.js";

/** One step of the manual level entry calculation. */
export interface ManualLevelEntryFactor {
  describe(): string;
  adjust(item: ManualLevelEntry, value: number): number;
}

export class FlaggedManualLevelEntryAdjuster implements ManualLevelEntryFactor {
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

  adjust(item: ManualLevelEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualLevelEntryAdjuster implements ManualLevelEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualLevelEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ManualLevelEntrySendAtOffsetAdjuster implements ManualLevelEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ManualLevelEntry, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the manual level entry steps in order and keeps a trace of each. */
export class ManualLevelEntryEngine {
  steps: ManualLevelEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualLevelEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualLevelEntry): number {
    let current = item.netValue();
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

  evaluateAll(items: ManualLevelEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualLevelEntryEngine(flagsValue: flags.Registry): ManualLevelEntryEngine {
  return new ManualLevelEntryEngine(
    [
      new FlaggedManualLevelEntryAdjuster(flagsValue, "manual-level-entry-primary", 6.2),
      new RoundingManualLevelEntryAdjuster(0.5),
      new ManualLevelEntrySendAtOffsetAdjuster(0.55),
    ],
    [],
    3,
    86152.2,
  );
}
