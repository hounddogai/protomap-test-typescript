import * as numbers from "../../../../kit/numbers.js";
import { PrimaryStreakThreshold } from "./primary-streak-threshold.js";

/** One step of the primary streak threshold calculation. */
export interface PrimaryStreakThresholdModifier {
  describe(): string;
  adjust(item: PrimaryStreakThreshold, value: number): number;
}

export class MinimumPrimaryStreakThresholdAdjuster implements PrimaryStreakThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryStreakThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PrimaryStreakThresholdRetriesOffsetAdjuster implements PrimaryStreakThresholdModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PrimaryStreakThreshold, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingPrimaryStreakThresholdAdjuster implements PrimaryStreakThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryStreakThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryStreakThresholdAdjuster implements PrimaryStreakThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryStreakThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary streak threshold steps in order and keeps a trace of each. */
export class PrimaryStreakThresholdEngine {
  steps: PrimaryStreakThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryStreakThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryStreakThreshold): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryStreakThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryStreakThresholdEngine(): PrimaryStreakThresholdEngine {
  return new PrimaryStreakThresholdEngine(
    [
      new MinimumPrimaryStreakThresholdAdjuster(48.3),
      new PrimaryStreakThresholdRetriesOffsetAdjuster(1.7),
      new RoundingPrimaryStreakThresholdAdjuster(0.05),
      new TieredPrimaryStreakThresholdAdjuster([162, 3273, 6953, 7404], [1.1, 1.03, 0.83, 1.13]),
    ],
    [],
    2.9,
    53097.3,
  );
}
