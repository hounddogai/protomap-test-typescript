import * as numbers from "../../../../kit/numbers.js";
import { StrictRedemptionException } from "./strict-redemption-exception.js";

/** One step of the strict redemption exception calculation. */
export interface StrictRedemptionExceptionStep {
  describe(): string;
  adjust(item: StrictRedemptionException, value: number): number;
}

export class TitleStrictRedemptionExceptionAdjuster implements StrictRedemptionExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StrictRedemptionException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictRedemptionExceptionScoreOffsetAdjuster implements StrictRedemptionExceptionStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: StrictRedemptionException, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapStrictRedemptionExceptionAdjuster implements StrictRedemptionExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictRedemptionException, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict redemption exception steps in order and keeps a trace of each. */
export class StrictRedemptionExceptionEngine {
  steps: StrictRedemptionExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictRedemptionExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictRedemptionException): number {
    let current = item.netLoad();
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

  evaluateAll(items: StrictRedemptionException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictRedemptionExceptionEngine(): StrictRedemptionExceptionEngine {
  return new StrictRedemptionExceptionEngine(
    [
      new TitleStrictRedemptionExceptionAdjuster(new Map<string, number>([["north", 0.91]])),
      new StrictRedemptionExceptionScoreOffsetAdjuster(1.26),
      new CapStrictRedemptionExceptionAdjuster(35685),
    ],
    [],
    0,
    32765.9,
  );
}
