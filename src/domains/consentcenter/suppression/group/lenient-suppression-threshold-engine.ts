import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

/** One step of the lenient suppression threshold calculation. */
export interface LenientSuppressionThresholdModifier {
  describe(): string;
  adjust(item: LenientSuppressionThreshold, value: number): number;
}

export class TieredLenientSuppressionThresholdAdjuster implements LenientSuppressionThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientSuppressionThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientSuppressionThresholdAdjuster implements LenientSuppressionThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientSuppressionThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientSuppressionThresholdAdjuster implements LenientSuppressionThresholdModifier {
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

  adjust(item: LenientSuppressionThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientSuppressionThresholdAdjuster implements LenientSuppressionThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientSuppressionThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient suppression threshold steps in order and keeps a trace of each. */
export class LenientSuppressionThresholdEngine {
  steps: LenientSuppressionThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSuppressionThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientSuppressionThreshold): number {
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

  evaluateAll(items: LenientSuppressionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientSuppressionThresholdEngine(flagsValue: flags.Registry): LenientSuppressionThresholdEngine {
  return new LenientSuppressionThresholdEngine(
    [
      new TieredLenientSuppressionThresholdAdjuster([4846, 7576], [1.19, 0.82]),
      new RoundingLenientSuppressionThresholdAdjuster(1),
      new FlaggedLenientSuppressionThresholdAdjuster(flagsValue, "lenient-suppression-threshold-manual", -8),
      new PercentLenientSuppressionThresholdAdjuster(-22.5),
    ],
    [],
    4.2,
    77154.9,
  );
}
