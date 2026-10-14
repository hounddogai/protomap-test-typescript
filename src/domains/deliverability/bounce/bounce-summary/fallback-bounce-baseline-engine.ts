import * as flags from "../../../../kit/flags.js";
import { FallbackBounceBaseline } from "./fallback-bounce-baseline.js";

/** One step of the fallback bounce baseline calculation. */
export interface FallbackBounceBaselineModifier {
  describe(): string;
  adjust(item: FallbackBounceBaseline, value: number): number;
}

export class FlaggedFallbackBounceBaselineAdjuster implements FallbackBounceBaselineModifier {
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

  adjust(item: FallbackBounceBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackBounceBaselineAdjuster implements FallbackBounceBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBounceBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackBounceBaselineAdjuster implements FallbackBounceBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackBounceBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceFallbackBounceBaselineAdjuster implements FallbackBounceBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: FallbackBounceBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback bounce baseline steps in order and keeps a trace of each. */
export class FallbackBounceBaselineEngine {
  steps: FallbackBounceBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBounceBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackBounceBaseline): number {
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

  evaluateAll(items: FallbackBounceBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackBounceBaselineEngine(flagsValue: flags.Registry): FallbackBounceBaselineEngine {
  return new FallbackBounceBaselineEngine(
    [
      new FlaggedFallbackBounceBaselineAdjuster(flagsValue, "fallback-bounce-baseline-pending", 2.5),
      new TieredFallbackBounceBaselineAdjuster([515, 3790, 4420, 4630], [1.05, 0.84, 0.85, 1.09]),
      new CapFallbackBounceBaselineAdjuster(12500),
      new UtmSourceFallbackBounceBaselineAdjuster(
        new Map<string, number>([["east", 0.71], ["south", 0.87], ["retail", 1.39]]),
      ),
    ],
    [],
    1.7,
    26269.1,
  );
}
