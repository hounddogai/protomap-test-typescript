import * as numbers from "../../../../kit/numbers.js";
import { LenientPathPreference } from "./lenient-path-preference.js";

/** One step of the lenient path preference calculation. */
export interface LenientPathPreferenceStep {
  describe(): string;
  adjust(item: LenientPathPreference, value: number): number;
}

export class RoundingLenientPathPreferenceAdjuster implements LenientPathPreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPathPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameLenientPathPreferenceAdjuster implements LenientPathPreferenceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientPathPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientPathPreferenceAdjuster implements LenientPathPreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPathPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientPathPreferenceAdjuster implements LenientPathPreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPathPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient path preference steps in order and keeps a trace of each. */
export class LenientPathPreferenceEngine {
  steps: LenientPathPreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPathPreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientPathPreference): number {
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

  evaluateAll(items: LenientPathPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientPathPreferenceEngine(): LenientPathPreferenceEngine {
  return new LenientPathPreferenceEngine(
    [
      new RoundingLenientPathPreferenceAdjuster(0.05),
      new NameLenientPathPreferenceAdjuster(
        new Map<string, number>([["online", 1.35], ["east", 0.95], ["west", 0.81]]),
      ),
      new PercentLenientPathPreferenceAdjuster(15.5),
      new MinimumLenientPathPreferenceAdjuster(40.3),
    ],
    [],
    1,
    37679.2,
  );
}
