import * as numbers from "../../../../kit/numbers.js";
import { FrequencyTarget } from "./frequency-target.js";

/** One step of the frequency target calculation. */
export interface FrequencyTargetAdjuster {
  describe(): string;
  adjust(item: FrequencyTarget, value: number): number;
}

export class SourceFrequencyTargetAdjuster implements FrequencyTargetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: FrequencyTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFrequencyTargetAdjuster implements FrequencyTargetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FrequencyTargetDurationMinutesOffsetAdjuster implements FrequencyTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: FrequencyTarget, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumFrequencyTargetAdjuster implements FrequencyTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFrequencyTargetAdjuster implements FrequencyTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the frequency target steps in order and keeps a trace of each. */
export class FrequencyTargetEngine {
  steps: FrequencyTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FrequencyTarget): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: FrequencyTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFrequencyTargetEngine(): FrequencyTargetEngine {
  return new FrequencyTargetEngine(
    [
      new SourceFrequencyTargetAdjuster(
        new Map<string, number>([["east", 1.35], ["west", 0.75], ["online", 1.34]]),
      ),
      new CapFrequencyTargetAdjuster(15751),
      new FrequencyTargetDurationMinutesOffsetAdjuster(1.75),
      new MinimumFrequencyTargetAdjuster(44.6),
      new PercentFrequencyTargetAdjuster(25),
    ],
    [],
    3.1,
    5982.1,
  );
}
