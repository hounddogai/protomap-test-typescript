import * as flags from "../../../../kit/flags.js";
import { ManualPlacementEntry } from "./manual-placement-entry.js";

/** One step of the manual placement entry calculation. */
export interface ManualPlacementEntryStep {
  describe(): string;
  adjust(item: ManualPlacementEntry, value: number): number;
}

export class FlaggedManualPlacementEntryAdjuster implements ManualPlacementEntryStep {
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

  adjust(item: ManualPlacementEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentManualPlacementEntryAdjuster implements ManualPlacementEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPlacementEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualPlacementEntryAdjuster implements ManualPlacementEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPlacementEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual placement entry steps in order and keeps a trace of each. */
export class ManualPlacementEntryEngine {
  steps: ManualPlacementEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPlacementEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualPlacementEntry): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ManualPlacementEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualPlacementEntryEngine(flagsValue: flags.Registry): ManualPlacementEntryEngine {
  return new ManualPlacementEntryEngine(
    [
      new FlaggedManualPlacementEntryAdjuster(flagsValue, "manual-placement-entry-regional", 2.1),
      new PercentManualPlacementEntryAdjuster(-1.3),
      new CapManualPlacementEntryAdjuster(37149),
    ],
    [],
    1.4,
    14493.6,
  );
}
