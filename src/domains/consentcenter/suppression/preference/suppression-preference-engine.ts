import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionPreference } from "./suppression-preference.js";

/** One step of the suppression preference calculation. */
export interface SuppressionPreferenceAdjuster {
  describe(): string;
  adjust(item: SuppressionPreference, value: number): number;
}

export class MinimumSuppressionPreferenceAdjuster implements SuppressionPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleSuppressionPreferenceAdjuster implements SuppressionPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SuppressionPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSuppressionPreferenceAdjuster implements SuppressionPreferenceAdjuster {
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

  adjust(item: SuppressionPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentSuppressionPreferenceAdjuster implements SuppressionPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSuppressionPreferenceAdjuster implements SuppressionPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the suppression preference steps in order and keeps a trace of each. */
export class SuppressionPreferenceEngine {
  steps: SuppressionPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SuppressionPreference): number {
    let current = item.projectedValue();
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

  evaluateAll(items: SuppressionPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSuppressionPreferenceEngine(flagsValue: flags.Registry): SuppressionPreferenceEngine {
  return new SuppressionPreferenceEngine(
    [
      new MinimumSuppressionPreferenceAdjuster(13.5),
      new LocaleSuppressionPreferenceAdjuster(new Map<string, number>([["south", 1.04]])),
      new FlaggedSuppressionPreferenceAdjuster(flagsValue, "suppression-preference-regional", 1.6),
      new PercentSuppressionPreferenceAdjuster(-19.7),
      new RoundingSuppressionPreferenceAdjuster(1),
    ],
    [],
    2,
    1633.7,
  );
}
