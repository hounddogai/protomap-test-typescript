import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationBaseline } from "./activation-baseline.js";

/** One step of the activation baseline calculation. */
export interface ActivationBaselineModifier {
  describe(): string;
  adjust(item: ActivationBaseline, value: number): number;
}

export class FlaggedActivationBaselineAdjuster implements ActivationBaselineModifier {
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

  adjust(item: ActivationBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapActivationBaselineAdjuster implements ActivationBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentActivationBaselineAdjuster implements ActivationBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitActivationBaselineAdjuster implements ActivationBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ActivationBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the activation baseline steps in order and keeps a trace of each. */
export class ActivationBaselineEngine {
  steps: ActivationBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ActivationBaseline): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ActivationBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultActivationBaselineEngine(flagsValue: flags.Registry): ActivationBaselineEngine {
  return new ActivationBaselineEngine(
    [
      new FlaggedActivationBaselineAdjuster(flagsValue, "activation-baseline-strict", 2.7),
      new CapActivationBaselineAdjuster(20988),
      new PercentActivationBaselineAdjuster(-20.2),
      new UnitActivationBaselineAdjuster(
        new Map<string, number>([["west", 1.3], ["retail", 1], ["online", 1.16]]),
      ),
    ],
    [],
    4.3,
    72738.6,
  );
}
