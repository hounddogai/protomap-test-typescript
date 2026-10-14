import * as numbers from "../../../../kit/numbers.js";
import { FrequencyThreshold } from "./frequency-threshold.js";

/** One step of the frequency threshold calculation. */
export interface FrequencyThresholdAdjuster {
  describe(): string;
  adjust(item: FrequencyThreshold, value: number): number;
}

export class SourceFrequencyThresholdAdjuster implements FrequencyThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: FrequencyThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFrequencyThresholdAdjuster implements FrequencyThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFrequencyThresholdAdjuster implements FrequencyThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFrequencyThresholdAdjuster implements FrequencyThresholdAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FrequencyThresholdExpiresAtOffsetAdjuster implements FrequencyThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: FrequencyThreshold, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumFrequencyThresholdAdjuster implements FrequencyThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the frequency threshold steps in order and keeps a trace of each. */
export class FrequencyThresholdEngine {
  steps: FrequencyThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FrequencyThreshold): number {
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

  evaluateAll(items: FrequencyThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFrequencyThresholdEngine(): FrequencyThresholdEngine {
  return new FrequencyThresholdEngine(
    [
      new SourceFrequencyThresholdAdjuster(new Map<string, number>([["north", 0.84], ["retail", 1.17]])),
      new CapFrequencyThresholdAdjuster(23645),
      new RoundingFrequencyThresholdAdjuster(0.25),
      new PercentFrequencyThresholdAdjuster(12.4),
      new FrequencyThresholdExpiresAtOffsetAdjuster(0.83),
      new MinimumFrequencyThresholdAdjuster(34),
    ],
    [],
    5,
    62565.6,
  );
}
