import * as numbers from "../../../../kit/numbers.js";
import { FrequencyWindow } from "./frequency-window.js";

/** One step of the frequency window calculation. */
export interface FrequencyWindowStep {
  describe(): string;
  adjust(item: FrequencyWindow, value: number): number;
}

export class FrequencyWindowGraceDaysOffsetAdjuster implements FrequencyWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: FrequencyWindow, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumFrequencyWindowAdjuster implements FrequencyWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFrequencyWindowAdjuster implements FrequencyWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFrequencyWindowAdjuster implements FrequencyWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the frequency window steps in order and keeps a trace of each. */
export class FrequencyWindowEngine {
  steps: FrequencyWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FrequencyWindow): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: FrequencyWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFrequencyWindowEngine(): FrequencyWindowEngine {
  return new FrequencyWindowEngine(
    [
      new FrequencyWindowGraceDaysOffsetAdjuster(1.34),
      new MinimumFrequencyWindowAdjuster(33.4),
      new TieredFrequencyWindowAdjuster([2120, 4772, 7626], [0.84, 0.88, 1.2]),
      new CapFrequencyWindowAdjuster(15058),
    ],
    [],
    0.2,
    99001.9,
  );
}
