import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientPaywallBaseline } from "./lenient-paywall-baseline.js";

/** One step of the lenient paywall baseline calculation. */
export interface LenientPaywallBaselineAdjuster {
  describe(): string;
  adjust(item: LenientPaywallBaseline, value: number): number;
}

export class RoundingLenientPaywallBaselineAdjuster implements LenientPaywallBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPaywallBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientPaywallBaselineAdjuster implements LenientPaywallBaselineAdjuster {
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

  adjust(item: LenientPaywallBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelLenientPaywallBaselineAdjuster implements LenientPaywallBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LenientPaywallBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientPaywallBaselineAdjuster implements LenientPaywallBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPaywallBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLenientPaywallBaselineAdjuster implements LenientPaywallBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPaywallBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient paywall baseline steps in order and keeps a trace of each. */
export class LenientPaywallBaselineEngine {
  steps: LenientPaywallBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPaywallBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientPaywallBaseline): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: LenientPaywallBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientPaywallBaselineEngine(flagsValue: flags.Registry): LenientPaywallBaselineEngine {
  return new LenientPaywallBaselineEngine(
    [
      new RoundingLenientPaywallBaselineAdjuster(5),
      new FlaggedLenientPaywallBaselineAdjuster(flagsValue, "lenient-paywall-baseline-fallback", 3.8),
      new LabelLenientPaywallBaselineAdjuster(new Map<string, number>([["west", 1.22]])),
      new MinimumLenientPaywallBaselineAdjuster(2.8),
      new PercentLenientPaywallBaselineAdjuster(-8),
    ],
    [],
    3.2,
    9110.5,
  );
}
