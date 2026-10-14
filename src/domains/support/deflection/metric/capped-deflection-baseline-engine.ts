import * as numbers from "../../../../kit/numbers.js";
import { CappedDeflectionBaseline } from "./capped-deflection-baseline.js";

/** One step of the capped deflection baseline calculation. */
export interface CappedDeflectionBaselineAdjuster {
  describe(): string;
  adjust(item: CappedDeflectionBaseline, value: number): number;
}

export class PercentCappedDeflectionBaselineAdjuster implements CappedDeflectionBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedDeflectionBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelCappedDeflectionBaselineAdjuster implements CappedDeflectionBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedDeflectionBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCappedDeflectionBaselineAdjuster implements CappedDeflectionBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedDeflectionBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedDeflectionBaselineAdjuster implements CappedDeflectionBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedDeflectionBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped deflection baseline steps in order and keeps a trace of each. */
export class CappedDeflectionBaselineEngine {
  steps: CappedDeflectionBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedDeflectionBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedDeflectionBaseline): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: CappedDeflectionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedDeflectionBaselineEngine(): CappedDeflectionBaselineEngine {
  return new CappedDeflectionBaselineEngine(
    [
      new PercentCappedDeflectionBaselineAdjuster(3.7),
      new LabelCappedDeflectionBaselineAdjuster(
        new Map<string, number>([["central", 0.72], ["north", 1.19], ["retail", 1.33]]),
      ),
      new TieredCappedDeflectionBaselineAdjuster([868, 8918], [1.13, 0.88]),
      new MinimumCappedDeflectionBaselineAdjuster(42.3),
    ],
    [],
    2,
    96296.9,
  );
}
