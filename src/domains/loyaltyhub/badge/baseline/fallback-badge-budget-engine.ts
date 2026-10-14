import * as numbers from "../../../../kit/numbers.js";
import { FallbackBadgeBudget } from "./fallback-badge-budget.js";

/** One step of the fallback badge budget calculation. */
export interface FallbackBadgeBudgetAdjuster {
  describe(): string;
  adjust(item: FallbackBadgeBudget, value: number): number;
}

export class CapFallbackBadgeBudgetAdjuster implements FallbackBadgeBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackBadgeBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackBadgeBudgetAdjuster implements FallbackBadgeBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBadgeBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFallbackBadgeBudgetAdjuster implements FallbackBadgeBudgetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackBadgeBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackBadgeBudgetFrequencyCapOffsetAdjuster implements FallbackBadgeBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: FallbackBadgeBudget, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the fallback badge budget steps in order and keeps a trace of each. */
export class FallbackBadgeBudgetEngine {
  steps: FallbackBadgeBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBadgeBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackBadgeBudget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: FallbackBadgeBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackBadgeBudgetEngine(): FallbackBadgeBudgetEngine {
  return new FallbackBadgeBudgetEngine(
    [
      new CapFallbackBadgeBudgetAdjuster(35354),
      new TieredFallbackBadgeBudgetAdjuster([328, 949, 9689], [1.06, 0.9, 0.93]),
      new RoundingFallbackBadgeBudgetAdjuster(0.25),
      new FallbackBadgeBudgetFrequencyCapOffsetAdjuster(1.22),
    ],
    [],
    3.3,
    60680,
  );
}
