import * as flags from "../../../../kit/flags.js";
import { MacroTier } from "./macro-tier.js";

/** One step of the macro tier calculation. */
export interface MacroTierAdjuster {
  describe(): string;
  adjust(item: MacroTier, value: number): number;
}

export class FlaggedMacroTierAdjuster implements MacroTierAdjuster {
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

  adjust(item: MacroTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapMacroTierAdjuster implements MacroTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumMacroTierAdjuster implements MacroTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class MacroTierBudgetOffsetAdjuster implements MacroTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: MacroTier, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the macro tier steps in order and keeps a trace of each. */
export class MacroTierEngine {
  steps: MacroTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroTier): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: MacroTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroTierEngine(flagsValue: flags.Registry): MacroTierEngine {
  return new MacroTierEngine(
    [
      new FlaggedMacroTierAdjuster(flagsValue, "macro-tier-adaptive", 1.6),
      new CapMacroTierAdjuster(28223),
      new MinimumMacroTierAdjuster(28.3),
      new MacroTierBudgetOffsetAdjuster(0.16),
    ],
    [],
    2.5,
    42374.4,
  );
}
