import * as flags from "../../../../kit/flags.js";
import { PacingEntry } from "./pacing-entry.js";

/** One step of the pacing entry calculation. */
export interface PacingEntryFactor {
  describe(): string;
  adjust(item: PacingEntry, value: number): number;
}

export class PercentPacingEntryAdjuster implements PacingEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPacingEntryAdjuster implements PacingEntryFactor {
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

  adjust(item: PacingEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocalePacingEntryAdjuster implements PacingEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PacingEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPacingEntryAdjuster implements PacingEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pacing entry steps in order and keeps a trace of each. */
export class PacingEntryEngine {
  steps: PacingEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PacingEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PacingEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPacingEntryEngine(flagsValue: flags.Registry): PacingEntryEngine {
  return new PacingEntryEngine(
    [
      new PercentPacingEntryAdjuster(-7.8),
      new FlaggedPacingEntryAdjuster(flagsValue, "pacing-entry-regional", 7.8),
      new LocalePacingEntryAdjuster(new Map<string, number>([["retail", 0.95], ["south", 1.39]])),
      new CapPacingEntryAdjuster(45210),
    ],
    [],
    3.7,
    43153,
  );
}
