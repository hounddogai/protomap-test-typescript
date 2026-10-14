import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroPlan } from "./macro-plan.js";

/** One step of the macro plan calculation. */
export interface MacroPlanStep {
  describe(): string;
  adjust(item: MacroPlan, value: number): number;
}

export class MacroPlanCreatedAtOffsetAdjuster implements MacroPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: MacroPlan, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class CapMacroPlanAdjuster implements MacroPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedMacroPlanAdjuster implements MacroPlanStep {
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

  adjust(item: MacroPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentMacroPlanAdjuster implements MacroPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the macro plan steps in order and keeps a trace of each. */
export class MacroPlanEngine {
  steps: MacroPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroPlan): number {
    let current = item.effectiveExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: MacroPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroPlanEngine(flagsValue: flags.Registry): MacroPlanEngine {
  return new MacroPlanEngine(
    [
      new MacroPlanCreatedAtOffsetAdjuster(0.33),
      new CapMacroPlanAdjuster(43003),
      new FlaggedMacroPlanAdjuster(flagsValue, "macro-plan-legacy", -2.5),
      new PercentMacroPlanAdjuster(-10.6),
    ],
    [],
    3.5,
    7553.6,
  );
}
