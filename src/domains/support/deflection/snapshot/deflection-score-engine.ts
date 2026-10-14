import * as numbers from "../../../../kit/numbers.js";
import { DeflectionScore } from "./deflection-score.js";

/** One step of the deflection score calculation. */
export interface DeflectionScoreFactor {
  describe(): string;
  adjust(item: DeflectionScore, value: number): number;
}

export class RoundingDeflectionScoreAdjuster implements DeflectionScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class DeflectionScoreBidOffsetAdjuster implements DeflectionScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: DeflectionScore, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class TieredDeflectionScoreAdjuster implements DeflectionScoreFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDeflectionScoreAdjuster implements DeflectionScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the deflection score steps in order and keeps a trace of each. */
export class DeflectionScoreEngine {
  steps: DeflectionScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionScore): number {
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

  evaluateAll(items: DeflectionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionScoreEngine(): DeflectionScoreEngine {
  return new DeflectionScoreEngine(
    [
      new RoundingDeflectionScoreAdjuster(0.5),
      new DeflectionScoreBidOffsetAdjuster(0.76),
      new TieredDeflectionScoreAdjuster([283, 7246, 8469, 8916], [1.12, 0.91, 0.89, 1.17]),
      new MinimumDeflectionScoreAdjuster(19.2),
    ],
    [],
    1.1,
    36884.8,
  );
}
