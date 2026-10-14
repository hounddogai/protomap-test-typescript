import * as numbers from "../../../../kit/numbers.js";
import { DeflectionBaseline } from "./deflection-baseline.js";

/** One step of the deflection baseline calculation. */
export interface DeflectionBaselineModifier {
  describe(): string;
  adjust(item: DeflectionBaseline, value: number): number;
}

export class CapDeflectionBaselineAdjuster implements DeflectionBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameDeflectionBaselineAdjuster implements DeflectionBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DeflectionBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDeflectionBaselineAdjuster implements DeflectionBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDeflectionBaselineAdjuster implements DeflectionBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the deflection baseline steps in order and keeps a trace of each. */
export class DeflectionBaselineEngine {
  steps: DeflectionBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionBaseline): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DeflectionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionBaselineEngine(): DeflectionBaselineEngine {
  return new DeflectionBaselineEngine(
    [
      new CapDeflectionBaselineAdjuster(47468),
      new NameDeflectionBaselineAdjuster(new Map<string, number>([["retail", 1.19]])),
      new TieredDeflectionBaselineAdjuster([29, 1119, 2328, 3889], [0.94, 0.99, 1.05, 0.92]),
      new RoundingDeflectionBaselineAdjuster(0.25),
    ],
    [],
    0.7,
    49847.1,
  );
}
