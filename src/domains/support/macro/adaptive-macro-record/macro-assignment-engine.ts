import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroAssignment } from "./macro-assignment.js";

/** One step of the macro assignment calculation. */
export interface MacroAssignmentFactor {
  describe(): string;
  adjust(item: MacroAssignment, value: number): number;
}

export class RoundingMacroAssignmentAdjuster implements MacroAssignmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitMacroAssignmentAdjuster implements MacroAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: MacroAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedMacroAssignmentAdjuster implements MacroAssignmentFactor {
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

  adjust(item: MacroAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredMacroAssignmentAdjuster implements MacroAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapMacroAssignmentAdjuster implements MacroAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentMacroAssignmentAdjuster implements MacroAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the macro assignment steps in order and keeps a trace of each. */
export class MacroAssignmentEngine {
  steps: MacroAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MacroAssignment): number {
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

  evaluateAll(items: MacroAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMacroAssignmentEngine(flagsValue: flags.Registry): MacroAssignmentEngine {
  return new MacroAssignmentEngine(
    [
      new RoundingMacroAssignmentAdjuster(5),
      new UnitMacroAssignmentAdjuster(new Map<string, number>([["central", 0.84]])),
      new FlaggedMacroAssignmentAdjuster(flagsValue, "macro-assignment-fallback", -2.4),
      new TieredMacroAssignmentAdjuster([3377, 4345, 5340, 5748], [1.08, 0.99, 1.03, 0.95]),
      new CapMacroAssignmentAdjuster(37783),
      new PercentMacroAssignmentAdjuster(-4.1),
    ],
    [],
    2.3,
    28481.4,
  );
}
