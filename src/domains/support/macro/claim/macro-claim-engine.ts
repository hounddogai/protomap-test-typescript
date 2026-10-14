import * as flags from "../../../../kit/flags.js";
import { MacroClaim } from "./macro-claim.js";

/** One step of the macro claim calculation. */
export interface MacroClaimStep {
  describe(): string;
  adjust(item: MacroClaim, value: number): number;
}

export class TieredMacroClaimAdjuster implements MacroClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentMacroClaimAdjuster implements MacroClaimStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedMacroClaimAdjuster implements MacroClaimStep {
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

  adjust(item: MacroClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumMacroClaimAdjuster implements MacroClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the macro claim steps in order and keeps a trace of each. */
export class MacroClaimEngine {
  steps: MacroClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MacroClaim): number {
    let current = item.measuredValue();
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

  evaluateAll(items: MacroClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMacroClaimEngine(flagsValue: flags.Registry): MacroClaimEngine {
  return new MacroClaimEngine(
    [
      new TieredMacroClaimAdjuster([3464, 9547], [0.98, 0.89]),
      new PercentMacroClaimAdjuster(-4.9),
      new FlaggedMacroClaimAdjuster(flagsValue, "macro-claim-batched", -1.2),
      new MinimumMacroClaimAdjuster(40.9),
    ],
    [],
    4.9,
    81315.6,
  );
}
