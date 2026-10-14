import * as flags from "../../../../kit/flags.js";
import { ExitRuleEntry } from "./exit-rule-entry.js";

/** One step of the exit rule entry calculation. */
export interface ExitRuleEntryAdjuster {
  describe(): string;
  adjust(item: ExitRuleEntry, value: number): number;
}

export class CapExitRuleEntryAdjuster implements ExitRuleEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentExitRuleEntryAdjuster implements ExitRuleEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredExitRuleEntryAdjuster implements ExitRuleEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedExitRuleEntryAdjuster implements ExitRuleEntryAdjuster {
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

  adjust(item: ExitRuleEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule entry steps in order and keeps a trace of each. */
export class ExitRuleEntryEngine {
  steps: ExitRuleEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleEntry): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ExitRuleEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleEntryEngine(flagsValue: flags.Registry): ExitRuleEntryEngine {
  return new ExitRuleEntryEngine(
    [
      new CapExitRuleEntryAdjuster(30744),
      new PercentExitRuleEntryAdjuster(-9.1),
      new TieredExitRuleEntryAdjuster([1445, 5189, 9755], [0.94, 1.01, 0.84]),
      new FlaggedExitRuleEntryAdjuster(flagsValue, "exit-rule-entry-global", 2.2),
    ],
    [],
    2.4,
    20189.3,
  );
}
