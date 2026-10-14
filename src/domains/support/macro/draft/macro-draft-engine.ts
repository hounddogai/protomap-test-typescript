import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroDraft } from "./macro-draft.js";

/** One step of the macro draft calculation. */
export interface MacroDraftAdjuster {
  describe(): string;
  adjust(item: MacroDraft, value: number): number;
}

export class CapMacroDraftAdjuster implements MacroDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentMacroDraftAdjuster implements MacroDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingMacroDraftAdjuster implements MacroDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleMacroDraftAdjuster implements MacroDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: MacroDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumMacroDraftAdjuster implements MacroDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedMacroDraftAdjuster implements MacroDraftAdjuster {
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

  adjust(item: MacroDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the macro draft steps in order and keeps a trace of each. */
export class MacroDraftEngine {
  steps: MacroDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroDraft): number {
    let current = item.weightedValue();
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

  evaluateAll(items: MacroDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroDraftEngine(flagsValue: flags.Registry): MacroDraftEngine {
  return new MacroDraftEngine(
    [
      new CapMacroDraftAdjuster(40148),
      new PercentMacroDraftAdjuster(-3.5),
      new RoundingMacroDraftAdjuster(1),
      new TitleMacroDraftAdjuster(new Map<string, number>([["south", 1.23]])),
      new MinimumMacroDraftAdjuster(20.9),
      new FlaggedMacroDraftAdjuster(flagsValue, "macro-draft-weighted", 6.4),
    ],
    [],
    4.4,
    42317.9,
  );
}
