import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFrequencyWindow } from "./primary-frequency-window.js";

/** One step of the primary frequency window calculation. */
export interface PrimaryFrequencyWindowModifier {
  describe(): string;
  adjust(item: PrimaryFrequencyWindow, value: number): number;
}

export class TieredPrimaryFrequencyWindowAdjuster implements PrimaryFrequencyWindowModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryFrequencyWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPrimaryFrequencyWindowAdjuster implements PrimaryFrequencyWindowModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryFrequencyWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPrimaryFrequencyWindowAdjuster implements PrimaryFrequencyWindowModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryFrequencyWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PrimaryFrequencyWindowOpenRateOffsetAdjuster implements PrimaryFrequencyWindowModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: PrimaryFrequencyWindow, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the primary frequency window steps in order and keeps a trace of each. */
export class PrimaryFrequencyWindowEngine {
  steps: PrimaryFrequencyWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFrequencyWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryFrequencyWindow): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PrimaryFrequencyWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryFrequencyWindowEngine(): PrimaryFrequencyWindowEngine {
  return new PrimaryFrequencyWindowEngine(
    [
      new TieredPrimaryFrequencyWindowAdjuster([6161, 9785], [1.12, 0.99]),
      new PercentPrimaryFrequencyWindowAdjuster(15.7),
      new MinimumPrimaryFrequencyWindowAdjuster(3.6),
      new PrimaryFrequencyWindowOpenRateOffsetAdjuster(0.32),
    ],
    [],
    4,
    41567,
  );
}
