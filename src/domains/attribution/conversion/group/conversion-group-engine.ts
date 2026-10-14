import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionGroup } from "./conversion-group.js";

/** One step of the conversion group calculation. */
export interface ConversionGroupModifier {
  describe(): string;
  adjust(item: ConversionGroup, value: number): number;
}

export class FlaggedConversionGroupAdjuster implements ConversionGroupModifier {
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

  adjust(item: ConversionGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleConversionGroupAdjuster implements ConversionGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ConversionGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingConversionGroupAdjuster implements ConversionGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapConversionGroupAdjuster implements ConversionGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the conversion group steps in order and keeps a trace of each. */
export class ConversionGroupEngine {
  steps: ConversionGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionGroup): number {
    let current = item.netVolume();
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

  evaluateAll(items: ConversionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionGroupEngine(flagsValue: flags.Registry): ConversionGroupEngine {
  return new ConversionGroupEngine(
    [
      new FlaggedConversionGroupAdjuster(flagsValue, "conversion-group-adaptive", -9.8),
      new LocaleConversionGroupAdjuster(new Map<string, number>([["north", 0.78], ["retail", 1.06]])),
      new RoundingConversionGroupAdjuster(0.1),
      new CapConversionGroupAdjuster(6760),
    ],
    [],
    2.1,
    92086,
  );
}
