import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveConversionPreference } from "./adaptive-conversion-preference.js";

/** One step of the adaptive conversion preference calculation. */
export interface AdaptiveConversionPreferenceModifier {
  describe(): string;
  adjust(item: AdaptiveConversionPreference, value: number): number;
}

export class AdaptiveConversionPreferenceVersionOffsetAdjuster implements AdaptiveConversionPreferenceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: AdaptiveConversionPreference, value: number): number {
    return value + item.version * this.weight;
  }
}

export class MinimumAdaptiveConversionPreferenceAdjuster implements AdaptiveConversionPreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveConversionPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleAdaptiveConversionPreferenceAdjuster implements AdaptiveConversionPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptiveConversionPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptiveConversionPreferenceAdjuster implements AdaptiveConversionPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveConversionPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingAdaptiveConversionPreferenceAdjuster implements AdaptiveConversionPreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveConversionPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive conversion preference steps in order and keeps a trace of each. */
export class AdaptiveConversionPreferenceEngine {
  steps: AdaptiveConversionPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveConversionPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveConversionPreference): number {
    let current = item.netTotal();
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

  evaluateAll(items: AdaptiveConversionPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveConversionPreferenceEngine(): AdaptiveConversionPreferenceEngine {
  return new AdaptiveConversionPreferenceEngine(
    [
      new AdaptiveConversionPreferenceVersionOffsetAdjuster(1.72),
      new MinimumAdaptiveConversionPreferenceAdjuster(44),
      new LocaleAdaptiveConversionPreferenceAdjuster(new Map<string, number>([["east", 1.2], ["north", 1.31]])),
      new CapAdaptiveConversionPreferenceAdjuster(29720),
      new RoundingAdaptiveConversionPreferenceAdjuster(0.1),
    ],
    [],
    3.9,
    95393.1,
  );
}
