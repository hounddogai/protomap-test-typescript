import * as numbers from "../../../../kit/numbers.js";
import { StreakThreshold } from "./streak-threshold.js";

/** One step of the streak threshold calculation. */
export interface StreakThresholdStep {
  describe(): string;
  adjust(item: StreakThreshold, value: number): number;
}

export class NameStreakThresholdAdjuster implements StreakThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StreakThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StreakThresholdRetriesOffsetAdjuster implements StreakThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: StreakThreshold, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapStreakThresholdAdjuster implements StreakThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStreakThresholdAdjuster implements StreakThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the streak threshold steps in order and keeps a trace of each. */
export class StreakThresholdEngine {
  steps: StreakThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakThreshold): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: StreakThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakThresholdEngine(): StreakThresholdEngine {
  return new StreakThresholdEngine(
    [
      new NameStreakThresholdAdjuster(new Map<string, number>([["retail", 0.86], ["central", 1.05]])),
      new StreakThresholdRetriesOffsetAdjuster(1.14),
      new CapStreakThresholdAdjuster(7303),
      new RoundingStreakThresholdAdjuster(0.25),
    ],
    [],
    3.8,
    64471,
  );
}
