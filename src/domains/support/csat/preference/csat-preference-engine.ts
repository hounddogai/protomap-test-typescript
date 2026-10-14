import * as numbers from "../../../../kit/numbers.js";
import { CsatPreference } from "./csat-preference.js";

/** One step of the csat preference calculation. */
export interface CsatPreferenceAdjuster {
  describe(): string;
  adjust(item: CsatPreference, value: number): number;
}

export class RoundingCsatPreferenceAdjuster implements CsatPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCsatPreferenceAdjuster implements CsatPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCsatPreferenceAdjuster implements CsatPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCsatPreferenceAdjuster implements CsatPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CsatPreferenceCapacityOffsetAdjuster implements CsatPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: CsatPreference, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the csat preference steps in order and keeps a trace of each. */
export class CsatPreferenceEngine {
  steps: CsatPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CsatPreference): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: CsatPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCsatPreferenceEngine(): CsatPreferenceEngine {
  return new CsatPreferenceEngine(
    [
      new RoundingCsatPreferenceAdjuster(0.05),
      new PercentCsatPreferenceAdjuster(23.8),
      new CapCsatPreferenceAdjuster(9713),
      new TieredCsatPreferenceAdjuster([4130, 6274], [1.13, 1.03]),
      new CsatPreferenceCapacityOffsetAdjuster(1.83),
    ],
    [],
    2.2,
    90309,
  );
}
