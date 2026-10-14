import { LegacyStreakThreshold } from "./legacy-streak-threshold.js";

/** One step of the legacy streak threshold calculation. */
export interface LegacyStreakThresholdStep {
  describe(): string;
  adjust(item: LegacyStreakThreshold, value: number): number;
}

export class PercentLegacyStreakThresholdAdjuster implements LegacyStreakThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyStreakThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyStreakThresholdRetriesOffsetAdjuster implements LegacyStreakThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: LegacyStreakThreshold, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumLegacyStreakThresholdAdjuster implements LegacyStreakThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyStreakThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLegacyStreakThresholdAdjuster implements LegacyStreakThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyStreakThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy streak threshold steps in order and keeps a trace of each. */
export class LegacyStreakThresholdEngine {
  steps: LegacyStreakThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyStreakThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyStreakThreshold): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LegacyStreakThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyStreakThresholdEngine(): LegacyStreakThresholdEngine {
  return new LegacyStreakThresholdEngine(
    [
      new PercentLegacyStreakThresholdAdjuster(-20.2),
      new LegacyStreakThresholdRetriesOffsetAdjuster(1.09),
      new MinimumLegacyStreakThresholdAdjuster(38.8),
      new CapLegacyStreakThresholdAdjuster(46425),
    ],
    [],
    3.7,
    96360.1,
  );
}
