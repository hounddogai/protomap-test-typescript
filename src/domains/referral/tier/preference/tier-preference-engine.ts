import * as numbers from "../../../../kit/numbers.js";
import { TierPreference } from "./tier-preference.js";

/** One step of the tier preference calculation. */
export interface TierPreferenceAdjuster {
  describe(): string;
  adjust(item: TierPreference, value: number): number;
}

export class TierPreferenceBatchSizeOffsetAdjuster implements TierPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: TierPreference, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingTierPreferenceAdjuster implements TierPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTierPreferenceAdjuster implements TierPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameTierPreferenceAdjuster implements TierPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TierPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tier preference steps in order and keeps a trace of each. */
export class TierPreferenceEngine {
  steps: TierPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierPreference): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: TierPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierPreferenceEngine(): TierPreferenceEngine {
  return new TierPreferenceEngine(
    [
      new TierPreferenceBatchSizeOffsetAdjuster(0.07),
      new RoundingTierPreferenceAdjuster(0.05),
      new CapTierPreferenceAdjuster(38788),
      new NameTierPreferenceAdjuster(
        new Map<string, number>([["central", 0.91], ["retail", 1.3], ["online", 1.29]]),
      ),
    ],
    [],
    0.8,
    51855.8,
  );
}
