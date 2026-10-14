import * as flags from "../../../../kit/flags.js";
import { GlobalExitRuleEntry } from "./global-exit-rule-entry.js";

/** One step of the global exit rule entry calculation. */
export interface GlobalExitRuleEntryFactor {
  describe(): string;
  adjust(item: GlobalExitRuleEntry, value: number): number;
}

export class TieredGlobalExitRuleEntryAdjuster implements GlobalExitRuleEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalExitRuleEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalExitRuleEntryAdjuster implements GlobalExitRuleEntryFactor {
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

  adjust(item: GlobalExitRuleEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelGlobalExitRuleEntryAdjuster implements GlobalExitRuleEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalExitRuleEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalExitRuleEntryAdjuster implements GlobalExitRuleEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalExitRuleEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalExitRuleEntryAdjuster implements GlobalExitRuleEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalExitRuleEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global exit rule entry steps in order and keeps a trace of each. */
export class GlobalExitRuleEntryEngine {
  steps: GlobalExitRuleEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalExitRuleEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalExitRuleEntry): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: GlobalExitRuleEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalExitRuleEntryEngine(flagsValue: flags.Registry): GlobalExitRuleEntryEngine {
  return new GlobalExitRuleEntryEngine(
    [
      new TieredGlobalExitRuleEntryAdjuster([3063, 4152, 4856, 5746], [0.83, 1.03, 0.81, 0.99]),
      new FlaggedGlobalExitRuleEntryAdjuster(flagsValue, "global-exit-rule-entry-primary", 9.6),
      new LabelGlobalExitRuleEntryAdjuster(new Map<string, number>([["online", 1.18]])),
      new MinimumGlobalExitRuleEntryAdjuster(46.4),
      new CapGlobalExitRuleEntryAdjuster(46009),
    ],
    [],
    0,
    79093.1,
  );
}
