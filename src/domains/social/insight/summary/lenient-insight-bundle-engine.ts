import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientInsightBundle } from "./lenient-insight-bundle.js";

/** One step of the lenient insight bundle calculation. */
export interface LenientInsightBundleModifier {
  describe(): string;
  adjust(item: LenientInsightBundle, value: number): number;
}

export class MinimumLenientInsightBundleAdjuster implements LenientInsightBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientInsightBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LenientInsightBundleAmountOffsetAdjuster implements LenientInsightBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: LenientInsightBundle, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingLenientInsightBundleAdjuster implements LenientInsightBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientInsightBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientInsightBundleAdjuster implements LenientInsightBundleModifier {
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

  adjust(item: LenientInsightBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameLenientInsightBundleAdjuster implements LenientInsightBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientInsightBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientInsightBundleAdjuster implements LenientInsightBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientInsightBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient insight bundle steps in order and keeps a trace of each. */
export class LenientInsightBundleEngine {
  steps: LenientInsightBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientInsightBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientInsightBundle): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LenientInsightBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientInsightBundleEngine(flagsValue: flags.Registry): LenientInsightBundleEngine {
  return new LenientInsightBundleEngine(
    [
      new MinimumLenientInsightBundleAdjuster(6.8),
      new LenientInsightBundleAmountOffsetAdjuster(1.62),
      new RoundingLenientInsightBundleAdjuster(0.5),
      new FlaggedLenientInsightBundleAdjuster(flagsValue, "lenient-insight-bundle-pending", 1.1),
      new NameLenientInsightBundleAdjuster(
        new Map<string, number>([["north", 1.24], ["south", 0.99], ["online", 0.75]]),
      ),
      new PercentLenientInsightBundleAdjuster(15.9),
    ],
    [],
    0.2,
    9115.1,
  );
}
