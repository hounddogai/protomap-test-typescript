import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientConversionBaseline } from "./lenient-conversion-baseline.js";

/** One step of the lenient conversion baseline calculation. */
export interface LenientConversionBaselineAdjuster {
  describe(): string;
  adjust(item: LenientConversionBaseline, value: number): number;
}

export class LenientConversionBaselineRevisionOffsetAdjuster implements LenientConversionBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: LenientConversionBaseline, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class PercentLenientConversionBaselineAdjuster implements LenientConversionBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientConversionBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelLenientConversionBaselineAdjuster implements LenientConversionBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LenientConversionBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLenientConversionBaselineAdjuster implements LenientConversionBaselineAdjuster {
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

  adjust(item: LenientConversionBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientConversionBaselineAdjuster implements LenientConversionBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientConversionBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLenientConversionBaselineAdjuster implements LenientConversionBaselineAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientConversionBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient conversion baseline steps in order and keeps a trace of each. */
export class LenientConversionBaselineEngine {
  steps: LenientConversionBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientConversionBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientConversionBaseline): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LenientConversionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientConversionBaselineEngine(flagsValue: flags.Registry): LenientConversionBaselineEngine {
  return new LenientConversionBaselineEngine(
    [
      new LenientConversionBaselineRevisionOffsetAdjuster(1.43),
      new PercentLenientConversionBaselineAdjuster(-9.1),
      new LabelLenientConversionBaselineAdjuster(new Map<string, number>([["central", 0.85]])),
      new FlaggedLenientConversionBaselineAdjuster(flagsValue, "lenient-conversion-baseline-regional", -4),
      new RoundingLenientConversionBaselineAdjuster(0.25),
      new CapLenientConversionBaselineAdjuster(28132),
    ],
    [],
    2.8,
    2406.8,
  );
}
