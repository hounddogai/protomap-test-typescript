import * as numbers from "../../../../kit/numbers.js";
import { ManualPreferenceBaseline } from "./manual-preference-baseline.js";

/** One step of the manual preference baseline calculation. */
export interface ManualPreferenceBaselineFactor {
  describe(): string;
  adjust(item: ManualPreferenceBaseline, value: number): number;
}

export class TitleManualPreferenceBaselineAdjuster implements ManualPreferenceBaselineFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualPreferenceBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredManualPreferenceBaselineAdjuster implements ManualPreferenceBaselineFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPreferenceBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualPreferenceBaselineAdjuster implements ManualPreferenceBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPreferenceBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualPreferenceBaselineAdjuster implements ManualPreferenceBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualPreferenceBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual preference baseline steps in order and keeps a trace of each. */
export class ManualPreferenceBaselineEngine {
  steps: ManualPreferenceBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPreferenceBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualPreferenceBaseline): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ManualPreferenceBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualPreferenceBaselineEngine(): ManualPreferenceBaselineEngine {
  return new ManualPreferenceBaselineEngine(
    [
      new TitleManualPreferenceBaselineAdjuster(new Map<string, number>([["retail", 1.02], ["south", 0.97]])),
      new TieredManualPreferenceBaselineAdjuster([1070, 2737], [1.04, 0.89]),
      new CapManualPreferenceBaselineAdjuster(2641),
      new RoundingManualPreferenceBaselineAdjuster(5),
    ],
    [],
    4.5,
    96087.5,
  );
}
