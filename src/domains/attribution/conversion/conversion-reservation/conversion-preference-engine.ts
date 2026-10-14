import * as numbers from "../../../../kit/numbers.js";
import { ConversionPreference } from "./conversion-preference.js";

/** One step of the conversion preference calculation. */
export interface ConversionPreferenceFactor {
  describe(): string;
  adjust(item: ConversionPreference, value: number): number;
}

export class CapConversionPreferenceAdjuster implements ConversionPreferenceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumConversionPreferenceAdjuster implements ConversionPreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentConversionPreferenceAdjuster implements ConversionPreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ConversionPreferenceEndsAtOffsetAdjuster implements ConversionPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ConversionPreference, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the conversion preference steps in order and keeps a trace of each. */
export class ConversionPreferenceEngine {
  steps: ConversionPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ConversionPreference): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ConversionPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultConversionPreferenceEngine(): ConversionPreferenceEngine {
  return new ConversionPreferenceEngine(
    [
      new CapConversionPreferenceAdjuster(33953),
      new MinimumConversionPreferenceAdjuster(34),
      new PercentConversionPreferenceAdjuster(-3.8),
      new ConversionPreferenceEndsAtOffsetAdjuster(1.79),
    ],
    [],
    4.3,
    67557.9,
  );
}
