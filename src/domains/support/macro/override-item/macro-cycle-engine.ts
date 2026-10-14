import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroCycle } from "./macro-cycle.js";

/** One step of the macro cycle calculation. */
export interface MacroCycleFactor {
  describe(): string;
  adjust(item: MacroCycle, value: number): number;
}

export class CapMacroCycleAdjuster implements MacroCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingMacroCycleAdjuster implements MacroCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelMacroCycleAdjuster implements MacroCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: MacroCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentMacroCycleAdjuster implements MacroCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedMacroCycleAdjuster implements MacroCycleFactor {
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

  adjust(item: MacroCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MacroCycleVersionOffsetAdjuster implements MacroCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: MacroCycle, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the macro cycle steps in order and keeps a trace of each. */
export class MacroCycleEngine {
  steps: MacroCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MacroCycle): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: MacroCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMacroCycleEngine(flagsValue: flags.Registry): MacroCycleEngine {
  return new MacroCycleEngine(
    [
      new CapMacroCycleAdjuster(37291),
      new RoundingMacroCycleAdjuster(0.05),
      new LabelMacroCycleAdjuster(new Map<string, number>([["north", 0.89], ["central", 0.76]])),
      new PercentMacroCycleAdjuster(-5.9),
      new FlaggedMacroCycleAdjuster(flagsValue, "macro-cycle-tiered", 4.5),
      new MacroCycleVersionOffsetAdjuster(0.4),
    ],
    [],
    2.6,
    46867.7,
  );
}
