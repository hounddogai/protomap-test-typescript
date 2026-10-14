import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

/** One step of the global fraud check preference calculation. */
export interface GlobalFraudCheckPreferenceStep {
  describe(): string;
  adjust(item: GlobalFraudCheckPreference, value: number): number;
}

export class PercentGlobalFraudCheckPreferenceAdjuster implements GlobalFraudCheckPreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalFraudCheckPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalFraudCheckPreferenceAdjuster implements GlobalFraudCheckPreferenceStep {
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

  adjust(item: GlobalFraudCheckPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalFraudCheckPreferenceAdjuster implements GlobalFraudCheckPreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalFraudCheckPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalFraudCheckPreferenceOpenRateOffsetAdjuster implements GlobalFraudCheckPreferenceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: GlobalFraudCheckPreference, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class MinimumGlobalFraudCheckPreferenceAdjuster implements GlobalFraudCheckPreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalFraudCheckPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalFraudCheckPreferenceAdjuster implements GlobalFraudCheckPreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalFraudCheckPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global fraud check preference steps in order and keeps a trace of each. */
export class GlobalFraudCheckPreferenceEngine {
  steps: GlobalFraudCheckPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFraudCheckPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalFraudCheckPreference): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: GlobalFraudCheckPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalFraudCheckPreferenceEngine(flagsValue: flags.Registry): GlobalFraudCheckPreferenceEngine {
  return new GlobalFraudCheckPreferenceEngine(
    [
      new PercentGlobalFraudCheckPreferenceAdjuster(-19.6),
      new FlaggedGlobalFraudCheckPreferenceAdjuster(flagsValue, "global-fraud-check-preference-batched", 2),
      new RoundingGlobalFraudCheckPreferenceAdjuster(5),
      new GlobalFraudCheckPreferenceOpenRateOffsetAdjuster(1.71),
      new MinimumGlobalFraudCheckPreferenceAdjuster(31.7),
      new CapGlobalFraudCheckPreferenceAdjuster(1863),
    ],
    [],
    0.5,
    83106.1,
  );
}
