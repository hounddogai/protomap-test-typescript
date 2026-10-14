import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckPreference } from "./fraud-check-preference.js";

/** One step of the fraud check preference calculation. */
export interface FraudCheckPreferenceAdjuster {
  describe(): string;
  adjust(item: FraudCheckPreference, value: number): number;
}

export class FlaggedFraudCheckPreferenceAdjuster implements FraudCheckPreferenceAdjuster {
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

  adjust(item: FraudCheckPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFraudCheckPreferenceAdjuster implements FraudCheckPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentFraudCheckPreferenceAdjuster implements FraudCheckPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: FraudCheckPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FraudCheckPreferenceCostOffsetAdjuster implements FraudCheckPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: FraudCheckPreference, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumFraudCheckPreferenceAdjuster implements FraudCheckPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fraud check preference steps in order and keeps a trace of each. */
export class FraudCheckPreferenceEngine {
  steps: FraudCheckPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FraudCheckPreference): number {
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

  evaluateAll(items: FraudCheckPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFraudCheckPreferenceEngine(flagsValue: flags.Registry): FraudCheckPreferenceEngine {
  return new FraudCheckPreferenceEngine(
    [
      new FlaggedFraudCheckPreferenceAdjuster(flagsValue, "fraud-check-preference-scheduled", -5.3),
      new RoundingFraudCheckPreferenceAdjuster(0.5),
      new SegmentFraudCheckPreferenceAdjuster(new Map<string, number>([["retail", 1.27]])),
      new FraudCheckPreferenceCostOffsetAdjuster(1.96),
      new MinimumFraudCheckPreferenceAdjuster(34.9),
    ],
    [],
    4,
    66492.9,
  );
}
