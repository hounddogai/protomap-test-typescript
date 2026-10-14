import * as numbers from "../../../../kit/numbers.js";
import { SeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

/** One step of the seasonal frequency policy calculation. */
export interface SeasonalFrequencyPolicyFactor {
  describe(): string;
  adjust(item: SeasonalFrequencyPolicy, value: number): number;
}

export class PercentSeasonalFrequencyPolicyAdjuster implements SeasonalFrequencyPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalFrequencyPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalFrequencyPolicyAdjuster implements SeasonalFrequencyPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalFrequencyPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalFrequencyPolicyRateOffsetAdjuster implements SeasonalFrequencyPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: SeasonalFrequencyPolicy, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumSeasonalFrequencyPolicyAdjuster implements SeasonalFrequencyPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalFrequencyPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSeasonalFrequencyPolicyAdjuster implements SeasonalFrequencyPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalFrequencyPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleSeasonalFrequencyPolicyAdjuster implements SeasonalFrequencyPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SeasonalFrequencyPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal frequency policy steps in order and keeps a trace of each. */
export class SeasonalFrequencyPolicyEngine {
  steps: SeasonalFrequencyPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalFrequencyPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalFrequencyPolicy): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: SeasonalFrequencyPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalFrequencyPolicyEngine(): SeasonalFrequencyPolicyEngine {
  return new SeasonalFrequencyPolicyEngine(
    [
      new PercentSeasonalFrequencyPolicyAdjuster(12.2),
      new CapSeasonalFrequencyPolicyAdjuster(8466),
      new SeasonalFrequencyPolicyRateOffsetAdjuster(0.11),
      new MinimumSeasonalFrequencyPolicyAdjuster(15.8),
      new RoundingSeasonalFrequencyPolicyAdjuster(1),
      new LocaleSeasonalFrequencyPolicyAdjuster(new Map<string, number>([["south", 1.12]])),
    ],
    [],
    4.1,
    41499.1,
  );
}
